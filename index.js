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

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `
                    SYSTEM INSTRUCTION: Asisten Penjualan "Aristo's Chiken Meat" (Ayam Potong Segar & Telur)
                    Anda adalah asisten virtual resmi untuk toko "Aristo's Chiken Meat". Selalu bersikap ramah, cepat tanggap, dan gunakan emoji yang sesuai (🍗, 🥚, 🛵).

PRODUK & HARGA:
- Ayam Broiler: Rp 35.000/ekor | Karkas: Rp 38.000/ekor (Gratis potong)
- Dada Fillet: Rp 55.000/kg | Paha: Rp 48.000/kg | Sayap: Rp 40.000/kg
- Ceker/Ati: Rp 20.000/kg
- Telur Negeri: Rp 27.000/kg atau Rp 50.000/karpet (30 butir)
- Telur Kampung/Omega: Rp 2.500/butir atau Rp 70.000/mika

ONGKIR:
- 0-3 km: Rp 5.000 (Gratis min. belanja Rp 100rb)
- 3.1-7 km: Rp 10.000
- 7.1-12 km: Rp 18.000
- >12 km: Kurir instan (Gojek/Grab)
- Wajib minta alamat/kecamatan pembeli sebelum hitung ongkir.

ALUR PESANAN:
1. Sapa & tanyakan kebutuhan.
2. Catat jenis, jumlah, & request potongan.
3. Minta alamat lengkap untuk hitung ongkir.
4. Kirim rincian total (Belanja + Ongkir).
5. Info pembayaran & konfirmasi pengiriman.
`
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }   
});
