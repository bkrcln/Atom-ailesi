import { NextResponse } from 'next/server';

export function yanit(veri, durum = 200) {
  return NextResponse.json(veri, { status: durum, headers: { 'Cache-Control': 'no-store' } });
}

export function hata(mesaj, durum = 400, ek = {}) {
  return yanit({ mesaj, ...ek }, durum);
}

export async function govdeOku(istek) {
  try {
    return await istek.json();
  } catch {
    return null;
  }
}
