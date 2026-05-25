# Esnafım

Esnafım, küçük işletmeler için tasarlanmış modern bir randevu ve sipariş yönetim sistemi. Müşteri takibi, randevu planlama, sipariş yönetimi ve gerçek zamanlı sıra durumu görüntüleme özelliklerini tek bir platformda sunar.

## Özellikler

- 📊 **Dashboard**: Günlük özetler, istatistikler ve haftalık karşılaştırmalar
- 📅 **Randevu Yönetimi**: Takvim görünümü ile randevu planlama ve durum takibi
- 🛒 **Sipariş Yönetimi**: Ürün/hizmet siparişleri ve durum takibi
- 👥 **Müşteri Yönetimi**: Telefon ile arama, müşteri profilleri ve istatistikler
- 🏷️ **Hizmet Portföyü**: Hizmet ve ürün yönetimi
- ⚙️ **Ayarlar**: İşletme bilgileri, çalışma saatleri ve public link
- 📱 **Public Queue**: Müşteriler için sıra durumu görüntüleme sayfası

## Teknoloji Stack

- **Frontend**: React 19, Vite 8
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Routing**: React Router v7

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

1. Depoyu klonlayın:
```bash
git clone <repository-url>
cd esnafim
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Ortam değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPabase_ANON_KEY=your-supabase-anon-key
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Veritabanı Kurulumu

Supabase projenizde aşağıdaki migration dosyalarını çalıştırın:

1. `supabase/migrations/0001_initial_schema.sql` - Tablolar ve RLS politikaları
2. `supabase/migrations/0002_auth_trigger.sql` - Auth trigger
3. `supabase/migrations/0003_working_hours.sql` - Çalışma saatleri sütunu
4. `supabase/migrations/0004_add_slug_to_businesses.sql` - Slug sütunu

Migration dosyalarını Supabase dashboard'da SQL Editor üzerinden çalıştırabilirsiniz.

## Proje Yapısı

```
esnafim/
├── src/
│   ├── api/
│   │   └── supabaseClient.js      # Supabase istemcisi
│   ├── components/
│   │   ├── ui/                    # UI bileşenleri
│   │   ├── AuthProvider.jsx       # Auth sağlayıcısı
│   │   ├── Layout.jsx            # Ana layout
│   │   └── PrivateRoute.jsx      # Korumalı route
│   ├── pages/
│   │   ├── app/                  # Uygulama sayfaları
│   │   │   ├── appointments/     # Randevular
│   │   │   ├── orders/           # Siparişler
│   │   │   ├── customers/        # Müşteriler
│   │   │   ├── services/         # Hizmetler
│   │   │   ├── settings/         # Ayarlar
│   │   │   └── dashboard/       # Dashboard
│   │   ├── auth/                 # Auth sayfaları
│   │   │   ├── login.jsx
│   │   │   └── register.jsx
│   │   └── public/               # Public sayfalar
│   │       └── QueueStatus.jsx   # Sıra durumu
│   ├── stores/
│   │   ├── authStore.js          # Auth store
│   │   └── themeStore.js         # Theme store
│   ├── hooks/
│   │   └── useAuth.js            # Auth hook
│   ├── lib/
│   │   ├── utils.js              # Yardımcı fonksiyonlar
│   │   └── validators.js         # Validasyonlar
│   ├── App.jsx                   # Ana uygulama
│   └── main.jsx                  # Entry point
├── supabase/
│   └── migrations/               # Migration dosyaları
├── public/                       # Statik dosyalar
└── package.json
```

## Kullanım

### Kayıt Olma

1. Kayıt sayfasına gidin
2. İşletme adı, e-posta ve şifre girin
3. Kayıt ol butonuna tıklayın
4. Otomatik olarak işletme profiliniz oluşturulur

### Randevu Oluşturma

1. Randevular sayfasına gidin
2. "Yeni Randevu" butonuna tıklayın
3. Müşteri, hizmet, tarih ve saat seçin
4. Kaydet butonuna tıklayın

### Public Link Paylaşımı

1. Ayarlar sayfasına gidin
2. Slug alanını düzenleyin (örn: "berber-ali")
3. Kaydet butonuna tıklayın
4. Oluşan linki veya QR kodu müşterilerinizle paylaşın

## Build ve Deployment

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Vercel Deployment

1. Projeyi GitHub'a push edin
2. Vercel dashboard'da yeni proje oluşturun
3. Repository'yi seçin
4. Ortam değişkenlerini Vercel'e ekleyin
5. Deploy butonuna tıklayın

## Lisans

MIT

## Destek

Sorunlar için GitHub Issues kullanabilirsiniz.
