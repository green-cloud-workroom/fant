// A synthetic trusted-migration fixture, not a client-side migration tool.
export function trustSupplementReservationFixture(e) {
  e.state.rows.supplementContractProofs=(e.state.rows.productions||[])
    .filter(row=>row.supplementReservation?.version===1)
    .map(row=>({id:'p_'+row.id,kind:'production',version:1,productionId:row.id,
      skuId:row.supplementReservation.skuId,quantity:row.supplementReservation.quantity,
      orderRevision:row.orderRevision??0,updatedBy:'fixture-trusted-migration',updatedAt:e.today}));
}
