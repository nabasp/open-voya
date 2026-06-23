import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon } from 'lucide-react'

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}

export default function HomePage() {
  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-tailwindcss)</title>
      </Head>
      <div className="grid grid-col-1 text-2xl w-full text-center">
        <div>
          <Image
            className="ml-auto mr-auto"
            src="/images/logo.png"
            alt="Logo image"
            width={256}
            height={256}
          />
        </div>
        <span>⚡ Electron ⚡</span>
        <span>+</span>
        <span>Next.js</span>
        <span>+</span>
        <span>tailwindcss</span>
        <span>=</span>
        <span>💕 </span>
        <ButtonDemo/>
      </div>
      <div className="mt-1 w-full flex-wrap flex justify-center">
        <Link href="/next">Go to next page</Link>
      </div>
    </React.Fragment>
  )
}
