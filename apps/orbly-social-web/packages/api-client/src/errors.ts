const EXACT_MESSAGES: Record<string, string> = {
  "Email or username already taken": "Bu e-posta veya kullanıcı adı zaten kullanılıyor.",
  "Invalid credentials": "E-posta veya şifre hatalı.",
  "Account suspended": "Hesabın askıya alınmış. Destek ile iletişime geç.",
  Unauthorized: "Oturumun sona erdi. Lütfen tekrar giriş yap.",
  "User not found": "Kullanıcı bulunamadı.",
  "Invalid refresh token": "Oturumun süresi doldu. Lütfen tekrar giriş yap.",
  "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş":
    "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bağlantı iste.",
  "Bu hesap için şifre sıfırlama kullanılamaz":
    "Bu hesap sosyal giriş ile oluşturulmuş; e-posta ile şifre sıfırlanamaz.",
  "E-posta gönderilemedi. Lütfen daha sonra tekrar dene.":
    "E-posta gönderilemedi. Lütfen biraz sonra tekrar dene.",
  "Invalid Google token": "Google ile giriş başarısız. Tekrar dene.",
  "GIF search is not configured (set TENOR_API_KEY and/or GIPHY_API_KEY)":
    "GIF araması şu an kapalı.",
  "GIF provider error": "GIF araması geçici olarak kullanılamıyor.",
  "Canlı yayın şu an kullanılamıyor": "Canlı yayın şu an kullanılamıyor.",
  "Canlı yayın başlatılamadı": "Canlı yayın başlatılamadı. Biraz sonra tekrar dene.",
  "Canlı yayın bulunamadı": "Bu yayın sona ermiş veya bulunamadı.",
  "Zaten canlı yayındasın": "Zaten canlı yayındasın.",
  "Mesaj boş olamaz": "Bir mesaj yaz.",
  "Mesaj çok uzun": "Mesaj çok uzun.",
  Forbidden: "Bu işlem için yetkin yok.",
  "Mutual follow required for direct messages":
    "Mesaj göndermek için karşılıklı takip gerekir.",
  "Post not found": "Gönderi bulunamadı.",
  "Reposts cannot be edited": "Yeniden paylaşımlar düzenlenemez.",
  "Max 4 images": "En fazla 4 görsel ekleyebilirsin.",
  "Cannot follow yourself": "Kendi hesabını takip edemezsin.",
  "userId required": "İşlem tamamlanamadı. Sayfayı yenileyip tekrar dene.",
  profile: "Profil yüklenemedi. Sayfayı yenileyip tekrar dene.",
};

const DEV_PATTERNS =
  /LIVEKIT|\.env|pip install|uvicorn|API key|API_SECRET|mongodb:|localhost:\d|Internal server error|Request failed|Socket RPC|xhr poll|ECONNREFUSED|ENOTFOUND|Network request failed|RpcError|TypeError|undefined is not|Cannot read propert/i;

const SOCKET_FRIENDLY: Record<string, string> = {
  timeout: "Sunucuya ulaşılamadı. Biraz sonra tekrar dene.",
  connection: "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.",
  rpc: "Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene.",
};

function messageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return "İstek geçersiz. Bilgilerini kontrol edip tekrar dene.";
    case 401:
      return "Giriş yapman gerekiyor.";
    case 403:
      return "Bu işlem için yetkin yok.";
    case 404:
      return "Aradığın içerik bulunamadı.";
    case 409:
      return "Bu bilgi zaten kayıtlı.";
    case 422:
      return "İşlem şu an tamamlanamıyor. Lütfen tekrar dene.";
    case 429:
      return "Çok fazla deneme yaptın. Biraz bekle.";
    case 502:
    case 503:
      return "Sunucu şu an meşgul. Biraz sonra tekrar dene.";
    default:
      return status >= 500
        ? "Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar dene."
        : "Bir şeyler ters gitti. Lütfen tekrar dene.";
  }
}

function mapRawMessage(raw: string): string {
  if (EXACT_MESSAGES[raw]) return EXACT_MESSAGES[raw];
  if (DEV_PATTERNS.test(raw)) return messageFromStatus(500);

  const lower = raw.toLowerCase();
  if (lower.includes("username") && lower.includes("underscore")) {
    return "Kullanıcı adı yalnızca küçük harf, rakam ve alt çizgi (_) içerebilir.";
  }
  if (lower.includes("password") && lower.includes("at least")) {
    return "Şifre en az 8 karakter olmalı.";
  }
  if (lower.includes("already taken") || lower.includes("already exists")) {
    return "Bu bilgi zaten kullanılıyor.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Bağlantı kurulamadı. İnternetini kontrol et.";
  }

  return messageFromStatus(400);
}

type ClientErrorLike = { name: string; status: number; message: string };

function isClientError(error: unknown): error is ClientErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    ((error as ClientErrorLike).name === "ApiError" ||
      (error as ClientErrorLike).name === "RpcError") &&
    typeof (error as ClientErrorLike).status === "number"
  );
}

function userFacingMessage(raw: string, status: number): string {
  if (EXACT_MESSAGES[raw]) return EXACT_MESSAGES[raw];
  if (SOCKET_FRIENDLY[raw]) return SOCKET_FRIENDLY[raw];
  if (DEV_PATTERNS.test(raw)) return messageFromStatus(status);
  if (status === 0) return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  const mapped = mapRawMessage(raw);
  if (mapped !== messageFromStatus(400)) return mapped;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(raw) && raw.length <= 200) return raw;
  return messageFromStatus(status);
}

/** API / ağ hatalarını son kullanıcıya uygun Türkçe metne çevirir. */
export function formatUserError(error: unknown): string {
  if (isClientError(error)) {
    const raw = error.message?.trim() ?? "";
    if (error.status === 0 && SOCKET_FRIENDLY[raw]) {
      return SOCKET_FRIENDLY[raw];
    }
    if (raw && !raw.startsWith("[")) {
      return userFacingMessage(raw, error.status);
    }
    return messageFromStatus(error.status);
  }
  if (error instanceof TypeError && String(error.message).includes("fetch")) {
    return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  }
  if (error instanceof Error) {
    const msg = error.message?.trim() ?? "";
    if (msg && EXACT_MESSAGES[msg]) return EXACT_MESSAGES[msg];
    if (msg && SOCKET_FRIENDLY[msg]) return SOCKET_FRIENDLY[msg];
    if (msg && DEV_PATTERNS.test(msg)) return messageFromStatus(0);
    if (msg && /[çğıöşüÇĞİÖŞÜ]/.test(msg) && msg.length <= 200) return msg;
  }
  return "Bir şeyler ters gitti. Lütfen tekrar dene.";
}
