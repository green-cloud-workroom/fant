const user={uid:'local-fixture',email:'fixture@example.invalid',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})};
export function onAuthStateChanged(_,callback){setTimeout(()=>callback(user),0);return ()=>{};}
export async function signInWithEmailAndPassword(){return {user};}
export async function signOut(){throw Error('Local fixture: sign-out disabled');}
