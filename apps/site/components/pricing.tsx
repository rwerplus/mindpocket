"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSiteI18n } from "@/lib/site-i18n"

const GITHUB_REPO = "https://github.com/jihe520/mindpocket"

export default function Pricing() {
  const { t } = useSiteI18n()
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">{t.pricing.title}</h1>
          <p>{t.pricing.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-1 max-w-2xl mx-auto">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-medium">{t.pricing.planTitle}</CardTitle>
              <span className="my-3 block text-2xl font-semibold">{t.pricing.price}</span>
              <CardDescription className="text-sm">{t.pricing.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {t.pricing.features.map((item) => (
                  <li className="flex items-center gap-2" key={item}>
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href={GITHUB_REPO}>
                  <span>{t.pricing.github}</span>
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={GITHUB_REPO}>
                  <span>{t.pricing.deploy}</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
