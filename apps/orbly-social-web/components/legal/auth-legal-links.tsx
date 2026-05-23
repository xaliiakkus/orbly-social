import Link from "next/link";

type AuthLegalLinksProps = {
  /** Kayıt ekranında “kabul” vurgusu biraz daha belirgin */
  variant?: "login" | "signup";
};

export function AuthLegalLinks({ variant = "login" }: AuthLegalLinksProps) {
  const linkClass =
    "font-semibold text-accent hover:underline underline-offset-4";

  return (
    <p className="mt-6 text-center text-[12px] text-text-tertiary leading-relaxed px-2">
      {variant === "signup" ? (
        <>
          Kayıt olarak{" "}
          <Link href="/privacy" className={linkClass}>
            Gizlilik Politikası
          </Link>
          {" ve "}
          <Link href="/kvkk" className={linkClass}>
            KVKK Aydınlatma Metni
          </Link>
          ’ni okuduğunu ve kabul ettiğini beyan edersin. Okumak isteyenler metinlere
          tıklayabilir.
        </>
      ) : (
        <>
          Giriş yaparak{" "}
          <Link href="/privacy" className={linkClass}>
            Gizlilik Politikası
          </Link>
          {" ve "}
          <Link href="/kvkk" className={linkClass}>
            KVKK Aydınlatma Metni
          </Link>
          ’ne tabi olursun.
        </>
      )}
    </p>
  );
}
