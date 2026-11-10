export async function exportFile(name: string, content: string, mime: string) {
  const uri = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = uri;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(uri), 1000);
}
