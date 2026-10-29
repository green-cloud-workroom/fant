import {utils as sheetUtils,writeFile} from 'xlsx';
export {writeFile};

// These exports receive application rows, never serialized workbook/cell objects.
// Reject wrong-typed records instead of allowing SheetJS to treat them as formulas.
export function assertPrimitiveAoa(rows){
  if(!Array.isArray(rows))throw new TypeError('스프레드시트 데이터는 행 배열이어야 합니다.');
  for(let r=0;r<rows.length;r++){
    const row=rows[r];
    if(!Array.isArray(row))throw new TypeError(`스프레드시트 ${r+1}행 형식이 올바르지 않습니다.`);
    for(let c=0;c<row.length;c++){
      const value=row[c],kind=typeof value;
      if(value===null||value===undefined||kind==='string'||kind==='boolean'||kind==='number'&&Number.isFinite(value))continue;
      throw new TypeError(`스프레드시트 ${r+1}행 ${c+1}열은 문자열·유한 숫자·논리값만 사용할 수 있습니다.`);
    }
  }
  return rows;
}
export const utils={...sheetUtils,aoa_to_sheet(rows,options){return sheetUtils.aoa_to_sheet(assertPrimitiveAoa(rows),options);}};
