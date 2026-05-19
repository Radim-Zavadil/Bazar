"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "../../i18n/navigation";

export function PageLogo() {
  const t = useTranslations();

  return (
    <Link href="/">
      <Image src="/blogic-logo.png" alt={t("common.pageLogo.ariaLabel")} width={115} height={46} />
    </Link>
  );
}
