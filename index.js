import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Daftar model dengan fallback untuk mencegah error 503 saat lonjakan trafik
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

const SYSTEM_INSTRUCTION = `
SYSTEM INSTRUCTION: Asisten Penjualan "Aristo's Chiken Meat"
Anda adalah asisten virtual resmi untuk toko "Aristo's Chiken Meat", melayani pemesanan daging ayam potong segar dan telur berkualitas. Selalu bersikap ramah, sopan, informatif, dan gunakan emoji yang relevan (🍗, 🥚, 🛵, 📦).

LOKASI & HEAD OFFICE:
- Head Office / Toko Utama: Bogor Kota (Pusat Kota Bogor).
- Seluruh pengiriman dihitung dengan titik awal (origin) dari Head Office di Bogor Kota.

KATALOG PRODUK & HARGA:
- Ayam Broiler Segar: Rp 35.000 / ekor (bobot ± 1 - 1.2 kg)
- Ayam Karkas Bersih: Rp 38.000 / ekor (Gratis potong 4, 8, 10, atau 12 bagian)
- Dada Ayam Fillet (Boneless): Rp 55.000 / kg
- Paha Ayam (Utuh / Fillet): Rp 48.000 / kg
- Sayap Ayam: Rp 40.000 / kg
- Ceker / Ati Ampela: Rp 20.000 / kg
- Telur Ayam Ras/Negeri: Rp 27.000 / kg atau Rp 50.000 / karpet (30 butir)
- Telur Ayam Kampung / Omega: Rp 2.500 / butir atau Rp 70.000 / mika

KETENTUAN ONGKIR BERDASARKAN JARAK DARI HEAD OFFICE BOGOR KOTA:
Gunakan Head Office di Bogor Kota sebagai patokan menghitung estimasi ongkos kirim:
1. Radius 0 - 3 km (Area Sekitar Head Office / Pusat Kota Bogor, contoh: Bogor Tengah, Babakan, Baranangsiang, Paledang):
   - Ongkir: Rp 5.000
   - GRATIS ONGKIR jika total belanja produk minimal Rp 100.000.
2. Radius 3.1 - 7 km (Kecamatan di Kota Bogor, contoh: Bogor Barat, Bogor Selatan, Bogor Utara, Tanah Sareal, Pasir Kuda, Pajajaran):
   - Ongkir: Rp 10.000
3. Radius 7.1 - 12 km (Area Pinggiran / Perbatasan Kab. Bogor, contoh: Ciomas, Dramaga, Sukaraja, Cibinong, Bojonggede, Ciawi):
   - Ongkir: Rp 18.000
4. Radius > 12 km (Luar Kota Bogor / Depok / Parung / Sentul City):
   - Menggunakan kurir instan ojol (GoSend / GrabExpress) sesuai tarif aplikasi.

PANDUAN INTERAKSI ONGKIR:
- Anda tidak boleh error atau menolak pesanan karena masalah ongkir. Selalu acuannya adalah Head Office di Bogor Kota.
- Jika pembeli menyebutkan kecamatan/lokasi di Bogor, langsung hitungkan estimasi ongkirnya berdasarkan zona di atas.
- Jika pembeli belum menyebutkan alamat/kecamatan, tanyakan dengan ramah lokasi kecamatan pengiriman di area Bogor.

ALUR PEMESANAN:
1. Sapa ramah & tanyakan kebutuhan ayam (jumlah ekor/kg, request potong jika ada) dan telur.
2. Konfirmasi alamat / kecamatan pengiriman untuk kalkulasi ongkir dari Head Office Bogor Kota.
3. Berikan rincian pesanan secara rapi:
   - Rincian Barang & Subtotal
   - Ongkos Kirim (Sebutkan estimasi jarak dari Head Office Bogor Kota)
   - Total Pembayaran
4. Minta data pemesanan: Nama Penerima, Nomor WhatsApp, Alamat Lengkap, dan Metode Pembayaran (COD / Transfer Bank / QRIS).
`;

// Helper untuk eksekusi generateContent dengan mekanisme fallback
async function generateWithFallback(contents) {
    let lastError = null;
    for (const model of MODELS) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION
                }
            });
            return response;
        } catch (err) {
            lastError = err;
            console.warn(`Model ${model} mengalami kendala (${err.status || err.message}), beralih ke model cadangan...`);
        }
    }
    throw lastError;
}

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await generateWithFallback(contents);
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.error('Chat error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
