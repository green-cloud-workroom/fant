// Shared receipt guards, applied only by receiptRulesPatch.mjs.
export const RECEIPT_RULE_HELPERS = `    // Raw receipt revisions are committed with their outbox request. Inventory
    // clients cannot read productions directly; rules validate the current head.
    function rawReceipt(data) {
      return data.get('category', '') == 'raw'
        && data.get('sourceCollection', '') == 'productions'
        && data.get('sourceApp', '') == 'production'
        && data.get('eventType', '') == 'productReceipt';
    }
    function currentRawReceipt(data, reqId) {
      return data.get('revision', 0) is int && data.get('revision', 0) > 0
        && data.get('sourceId', '') != ''
        && reqId == 'productions:' + data.sourceId + ':' + string(data.revision)
        && getAfter(/databases/$(database)/documents/productions/$(data.sourceId)).data.receivedRevision == data.revision;
    }
    function rawAdjustmentBasis(data) {
      let base = get(/databases/$(database)/documents/productTransferRequests/$(data.correctionOf)).data;
      return data.correctionOf == 'productions:' + data.sourceId + ':' + string(base.revision)
        && base.sourceId == data.sourceId && base.revision < data.revision
        && base.status in ['completed', '입고완료']
        && data.basisBoxes == base.get('actualBoxes', base.boxes)
        && data.basisRemainderPacks == base.get('actualRemainderPacks', base.get('remainderPacks', 0))
        && data.correctionReason is string && data.correctionReason.size() > 0;
    }
    function rawCreateAllowed(data, reqId) {
      return currentRawReceipt(data, reqId) && data.status == 'pending'
        && (data.get('receiptMode', '') != 'adjustment' || rawAdjustmentBasis(data));
    }
    function receiptRevisionAllowed(productionId) {
      let before = resource.data.get('receivedRevision', 0);
      let after = request.resource.data.get('receivedRevision', 0);
      let requestId = 'productions:' + productionId + ':' + string(after);
      let previousId = 'productions:' + productionId + ':' + string(before);
      return request.resource.data.get('category', '') != 'raw' || after == before || (
        after is int && after == before + 1 && rawCreateAllowed(getAfter(/databases/$(database)/documents/productTransferRequests/$(requestId)).data, requestId)
        && (before == 0 || !exists(/databases/$(database)/documents/productTransferRequests/$(previousId))
          || !(get(/databases/$(database)/documents/productTransferRequests/$(previousId)).data.status in ['completed', '입고완료'])
          || (getAfter(/databases/$(database)/documents/productTransferRequests/$(requestId)).data.get('receiptMode', '') == 'adjustment' && getAfter(/databases/$(database)/documents/productTransferRequests/$(requestId)).data.correctionOf == previousId))
      );
    }

`;
export const RECEIPT_TRANSFER_RULES = `    match /productTransferRequests/{reqId} {
      allow read: if isProductionApp() || isInventoryApp();
      allow create: if isProductionStaff() && (!rawReceipt(request.resource.data)
        || rawCreateAllowed(request.resource.data, reqId));
      allow update: if isInventoryApp()
        && (resource.data.get('category', '') != 'raw' || request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'status', 'reviewedBy', 'reviewedAt', 'actualBoxes', 'actualRemainderPacks',
          'actualQuantity', 'expiryDate', 'createdStockLotId', 'createdSampleStockLotId',
          'rejectReason', 'reversedAt', 'reversedBy', 'reverseReason', 'manualAdjustment', 'manualReason', 'adjustmentStockLotIds', 'adjustmentContract'
        ]))
        && (resource.data.get('category', '') != 'raw'
          || !(request.resource.data.status in ['completed', '입고완료'])
          || (rawReceipt(resource.data) && currentRawReceipt(resource.data, reqId)
            && (resource.data.get('receiptMode', '') != 'adjustment' || (rawAdjustmentBasis(resource.data)
              && request.resource.data.actualBoxes == resource.data.boxes
              && request.resource.data.actualRemainderPacks == resource.data.remainderPacks
              && request.resource.data.get('adjustmentContract', null) is map
              && request.resource.data.adjustmentContract.version == 1
              && request.resource.data.adjustmentContract.appliedAt == request.time
              && request.resource.data.adjustmentContract.boxesDelta == resource.data.boxes - resource.data.basisBoxes
              && request.resource.data.adjustmentContract.packsDelta == resource.data.remainderPacks - resource.data.basisRemainderPacks))))
        && (!request.resource.data.get('manualAdjustment', false) || (isInventoryAdminWriter()
          && request.resource.data.manualReason is string && request.resource.data.manualReason.size() > 0))
        && (resource.data.get('category', '') != 'raw' || !(resource.data.status in ['completed', '입고완료'])
          || request.resource.data.status == resource.data.status
          || (resource.data.get('receiptMode', '') != 'adjustment' && currentRawReceipt(resource.data, reqId)));
      allow delete: if false;
    }`;
