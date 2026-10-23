import { doc, collection } from 'firebase/firestore';

// FIFO calculation shared by the page and real SDK regression tests. All IO is staged.
export async function buildProductionLoad({ db, today, nextBizDay, staffName, writer, executionId, meatStocks, recipes, targetProductions, recordMeatLog, recordActivity, notify }) {
  const { getDoc, updateDoc, addDoc, setDoc } = writer;
    const meatNeeds = {};
    const bagNeeds = {};

    for (const p of targetProductions) {
      const recipe = recipes.find(r => r.id === p.recipeId);
      if (!recipe) continue;
      (p.ingredientsSnapshot || []).forEach(ing => {
        if (ing.autoDeductInventory && ing.meatTypeId) {
          meatNeeds[ing.meatTypeId] = (meatNeeds[ing.meatTypeId] || 0) + ing.requiredQtyG;
        }
      });
      if (recipe.category === 'raw' && recipe.bagTypeId) {
        const boxQty = p.rawBoxQty || 0;
        const bagSnap = await getDoc(doc(db, 'bagTypes', recipe.bagTypeId));
        if (bagSnap.exists()) {
          bagNeeds[recipe.bagTypeId] = (bagNeeds[recipe.bagTypeId] || 0) + (boxQty * 20); // 1제품박스=20팩=봉투20장
        }
      }
    }

    // 봉투 재고 체크
    for (const [bagTypeId, needed] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        if (current < needed) {
          notify(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${bagSnap.data().name || ''} 봉투: 현재 ${current}장 / 필요 ${needed}장`);
          return false;
        }
      }
    }

        // 원육 합계 부족 사전 체크 (재포장 + 전처리 + 냉동창고)
    // 단위중량 올림 차감 고려
    for (const [meatTypeId, neededG] of Object.entries(meatNeeds)) {
      const repackedSum = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'repacked' && s.remaining > 0)
        .reduce((sum, s) => sum + s.remaining, 0);

      const processedLots = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'processed' && s.remaining > 0)
        .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));
      const processedSum = processedLots.reduce((sum, s) => sum + s.remaining, 0);

      const frozenSum = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'frozen' && s.remaining > 0)
        .reduce((sum, s) => sum + s.remaining, 0);

      const totalAvailable = repackedSum + processedSum + frozenSum;

      if (totalAvailable < neededG) {
        const meatName = meatStocks.find(s => s.meatTypeId === meatTypeId)?.meatNameSnapshot || meatTypeId;
        notify(
          `${meatName} 재고가 부족하여 내일 생산을 불러올 수 없습니다.\n\n` +
          `필요량: ${(neededG/1000).toFixed(1)}kg\n` +
          `현재 합계: ${(totalAvailable/1000).toFixed(1)}kg\n` +
          `  - 재포장: ${(repackedSum/1000).toFixed(1)}kg\n` +
          `  - 전처리: ${(processedSum/1000).toFixed(1)}kg\n` +
          `  - 냉동창고: ${(frozenSum/1000).toFixed(1)}kg`
        );
        return false;
      }
    }

    const ledgerItems = [];
    const productionBatchId = executionId;
    const consumedRepackedIds = new Set();

    // 원육 FIFO 차감
    for (const [meatTypeId, neededG] of Object.entries(meatNeeds)) {
      let remaining = neededG;

      const repackedStocks = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'repacked' && s.remaining > 0)
        .sort((a, b) => (a.repackedDate || '').localeCompare(b.repackedDate || ''));

      for (const s of repackedStocks) {
        if (remaining <= 0) break;
        const deduct = Math.min(s.remaining, remaining);
        const newRemaining = s.remaining - deduct;
        await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
        ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 재포장`, stockUpdatedAtSnapshot: new Date() });

        await recordMeatLog({
          type: 'productionDeduct',
          date: today,
          meatTypeId,
          meatNameSnapshot: s.meatNameSnapshot,
          stage: 'repacked',
          meatStockId: s.id,
          delta: -deduct,
          before: s.remaining,
          after: newRemaining,
          staff: staffName,
          reason: '내일생산불러오기 차감',
          batchId: productionBatchId,
        });

        consumedRepackedIds.add(s.id);
        s.remaining = newRemaining;
        remaining -= deduct;
      }

      if (remaining > 0) {
        const processedStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'processed' && s.remaining > 0)
          .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

        for (const s of processedStocks) {
          if (remaining <= 0) break;
          const unitW = s.unitWeightG || 1;
          const deductG = Math.min(s.remaining, Math.ceil(remaining / unitW) * unitW);
          const newRemaining = s.remaining - deductG;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deductG, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 전처리`, stockUpdatedAtSnapshot: new Date() });

          await recordMeatLog({
            type: 'productionDeduct',
            date: today,
            meatTypeId,
            meatNameSnapshot: s.meatNameSnapshot,
            stage: 'processed',
            meatStockId: s.id,
            delta: -deductG,
            before: s.remaining,
            after: newRemaining,
            staff: staffName,
            reason: '내일생산불러오기 차감',
            batchId: productionBatchId,
          });

          // 잉여분 → 재포장으로 자동 입고
          const surplusG = deductG - remaining;
          if (surplusG > 0) {
            const existingRepacked = meatStocks.find(rs =>
              rs.meatTypeId === meatTypeId && rs.stage === 'repacked' && (rs.remaining > 0 || consumedRepackedIds.has(rs.id))
            );

            if (existingRepacked) {
              const newRepackedRemaining = existingRepacked.remaining + surplusG;
              await updateDoc(doc(db, 'meatStocks', existingRepacked.id), {
                remaining: newRepackedRemaining,
                closed: false,
                updatedAt: new Date(),
              });
              ledgerItems.push({
                collection: 'meatStocks',
                docId: existingRepacked.id,
                field: 'remaining',
                delta: surplusG,
                before: existingRepacked.remaining,
                after: newRepackedRemaining,
                label: `${s.meatNameSnapshot} 재포장 자동입고`,
                stockUpdatedAtSnapshot: new Date(),
              });

              await recordMeatLog({
                type: 'repackedIn',
                date: today,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                meatStockId: existingRepacked.id,
                delta: surplusG,
                before: existingRepacked.remaining,
                after: newRepackedRemaining,
                staff: staffName,
                reason: '생산 자동 재포장 (기존 lot 합산)',
                batchId: productionBatchId,
              });

              // [묶음 6E-2] 자동 재포장 발생 → 활동 로그 발행 (확인 필수)
              // 기존 재포장 lot에 잔여분 합산. 운영자가 메인 화면 생산 로그에서 [확인] 클릭 필요.
              await recordActivity({
                action: 'autoRepack',
                subAction: 'trigger',
                date: today,
                staff: '시스템',
                message: `🔄 생산 자동 재포장 — ${s.meatNameSnapshot} ${(surplusG/1000).toFixed(2)}kg (전처리 ${s.unitWeightG}g 단위 차감 후 잔여, 기존 재포장 lot 합산)`,
                details: {
                  meatTypeId,
                  meatName: s.meatNameSnapshot,
                  surplusG,
                  processedUnitWeightG: s.unitWeightG,
                  processedStockId: s.id,
                  repackedStockId: existingRepacked.id,
                  mode: 'merged',
                  batchId: productionBatchId,
                },
              });

              existingRepacked.remaining = newRepackedRemaining;
            } else {
              const newRepackedRef = await addDoc(collection(db, 'meatStocks'), {
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                incomingDate: today,
                repackedDate: today,
                unitWeightG: null,
                unitCount: null,
                initialQtyG: surplusG,
                remaining: surplusG,
                batchId: productionBatchId,
                staffName,
                note: '생산 자동 재포장',
                closed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              ledgerItems.push({
                collection: 'meatStocks',
                docId: newRepackedRef.id,
                field: 'remaining',
                delta: surplusG,
                before: 0,
                after: surplusG,
                label: `${s.meatNameSnapshot} 재포장 자동신규`,
                stockUpdatedAtSnapshot: new Date(),
                isNewDoc: true,
              });

              await recordMeatLog({
                type: 'repackedIn',
                date: today,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                meatStockId: newRepackedRef.id,
                delta: surplusG,
                before: 0,
                after: surplusG,
                staff: staffName,
                reason: '생산 자동 재포장 (신규 lot)',
                batchId: productionBatchId,
              });

              // [묶음 6E-2] 자동 재포장 발생 → 활동 로그 발행 (확인 필수)
              // 기존 lot 없어 신규 재포장 lot 생성. 운영자가 [확인] 클릭 필요.
              await recordActivity({
                action: 'autoRepack',
                subAction: 'trigger',
                date: today,
                staff: '시스템',
                message: `🔄 생산 자동 재포장 — ${s.meatNameSnapshot} ${(surplusG/1000).toFixed(2)}kg (전처리 ${s.unitWeightG}g 단위 차감 후 잔여, 신규 재포장 lot)`,
                details: {
                  meatTypeId,
                  meatName: s.meatNameSnapshot,
                  surplusG,
                  processedUnitWeightG: s.unitWeightG,
                  processedStockId: s.id,
                  repackedStockId: newRepackedRef.id,
                  mode: 'newLot',
                  batchId: productionBatchId,
                },
              });

              meatStocks.push({
                id: newRepackedRef.id,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                remaining: surplusG,
                unitWeightG: null,
              });
            }
          }

          remaining -= deductG;
        }
      }

      if (remaining > 0) {
        const frozenStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'frozen' && s.remaining > 0)
          .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

        for (const s of frozenStocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(s.remaining, remaining);
          const newRemaining = s.remaining - deduct;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 냉동창고`, stockUpdatedAtSnapshot: new Date() });

          await recordMeatLog({
            type: 'productionDeduct',
            date: today,
            meatTypeId,
            meatNameSnapshot: s.meatNameSnapshot,
            stage: 'frozen',
            meatStockId: s.id,
            delta: -deduct,
            before: s.remaining,
            after: newRemaining,
            staff: staffName,
            reason: '내일생산불러오기 차감',
            batchId: productionBatchId,
          });

          remaining -= deduct;
        }
      }
    }

    // 봉투 차감
    for (const [bagTypeId, neededPcs] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        const newQty = current - neededPcs;
        await updateDoc(doc(db, 'bagTypes', bagTypeId), { currentQty: newQty, updatedAt: new Date() });
        ledgerItems.push({ collection: 'bagTypes', docId: bagTypeId, field: 'currentQty', delta: -neededPcs, before: current, after: newQty, label: `${bagSnap.data().name} 봉투`, stockUpdatedAtSnapshot: new Date() });
        await addDoc(collection(db, 'bagLogs'), { date: today, timestamp: new Date(), bagTypeId, bagNameSnapshot: bagSnap.data().name, type: 'autoDeduct', qty: -neededPcs, before: current, after: newQty, staffName, note: '내일생산불러오기 자동차감' });
      }
    }

    // ledger 저장
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'productionCompletion',
      actionId: today,
      timestamp: new Date(),
      runDate: today,
      status: 'active',
      items: ledgerItems,
    });

    // productionCompletion 저장
    await setDoc(doc(db, 'productionCompletion', today), {
      runDate: today,
      targetProductionDate: nextBizDay,
      status: 'completed',
      idempotencyKey: `productionCompletion:${today}`,
      staffName,
      ledgerId: ledgerRef.id,
      completedAt: new Date(),
    });

    for (const p of targetProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: true });
    }


}
