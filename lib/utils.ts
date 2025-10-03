export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+/, '').replace(/-+$/, '');
}
export function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID').format(n);
}
