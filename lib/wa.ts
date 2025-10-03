export function waLink(phone: string, text: string) {
  const normalized = phone.replace(/^0/, '62');
  const t = encodeURIComponent(text);
  return `https://wa.me/${normalized}?text=${t}`;
}
export function paymentTemplate({ buyerName, orderCode, totalWithUnique, bankName, accountName, bankAccount }:
  { buyerName: string; orderCode: string; totalWithUnique: number; bankName: string; accountName: string; bankAccount: string; }) {
  return [
    `Halo Admin, saya ${buyerName}.`,
    `Saya ingin konfirmasi pembayaran untuk pesanan ${orderCode}.`,
    `Nominal transfer: Rp ${new Intl.NumberFormat('id-ID').format(totalWithUnique)}`,
    `Tujuan: ${bankName} a.n. ${accountName} (${bankAccount})`,
    ``,
    `Terima kasih.`
  ].join("\n");
}
