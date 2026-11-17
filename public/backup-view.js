// Download helper shared by templates and complete CSV backups; no remote writes.
export const downloadText = (name,text,type='text/plain') => {
 const url=URL.createObjectURL(new Blob([text],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
