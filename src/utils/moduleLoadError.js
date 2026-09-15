export function isModuleLoadError(error){
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(error?.message||'');
}
