type AddressFormResult =
  | { success: true; data: AddressFormData }
  | { success: false; error: string };

export type AddressFormData = {
  fullName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
  additionalInfo: string | null;
};

export function resolveRedirect(
  redirectTo: FormDataEntryValue | null,
  reqUrl: string,
  fallback: string,
) {
  const base = new URL(reqUrl);
  if (typeof redirectTo !== "string" || redirectTo.trim().length === 0) {
    return new URL(fallback, base);
  }

  try {
    const target = new URL(redirectTo, base);
    if (target.origin !== base.origin) {
      return new URL(fallback, base);
    }
    return target;
  } catch {
    return new URL(fallback, base);
  }
}

export function parseAddressForm(form: FormData): AddressFormResult {
  const fullNameRaw = form.get("fullName");
  const phoneRaw = form.get("phoneNumber");
  const provinceRaw = form.get("province");
  const cityRaw = form.get("city");
  const districtRaw = form.get("district");
  const postalCodeRaw = form.get("postalCode");
  const addressLineRaw = form.get("addressLine");
  const additionalRaw = form.get("additionalInfo");

  const fullName = typeof fullNameRaw === "string" ? fullNameRaw.trim() : "";
  const phoneNumber = typeof phoneRaw === "string" ? phoneRaw.trim() : "";
  const province = typeof provinceRaw === "string" ? provinceRaw.trim() : "";
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";
  const district = typeof districtRaw === "string" ? districtRaw.trim() : "";
  const postalCode = typeof postalCodeRaw === "string" ? postalCodeRaw.trim() : "";
  const addressLine = typeof addressLineRaw === "string" ? addressLineRaw.trim() : "";
  const additionalInfo = typeof additionalRaw === "string" ? additionalRaw.trim() : "";

  const requiredFields: [string, string][] = [
    ["Nama Lengkap", fullName],
    ["Nomor telepon", phoneNumber],
    ["Provinsi", province],
    ["Kota", city],
    ["Kecamatan", district],
    ["Kode pos", postalCode],
    ["Alamat lengkap", addressLine],
  ];

  for (const [label, value] of requiredFields) {
    if (!value) {
      return { success: false, error: `${label} wajib diisi.` };
    }
  }

  if (!/^\d{4,10}$/.test(postalCode)) {
    return { success: false, error: "Kode pos harus berupa 4-10 digit angka." };
  }

  if (phoneNumber && !/^\+?\d{6,15}$/.test(phoneNumber)) {
    return { success: false, error: "Nomor telepon tidak valid." };
  }

  return {
    success: true,
    data: {
      fullName,
      phoneNumber,
      province,
      city,
      district,
      postalCode,
      addressLine,
      additionalInfo: additionalInfo ? additionalInfo : null,
    },
  };
}
