import React from 'react'

import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react'

import '../styles/globals.css'

export default function({ Component, pageProps }) {
  return (
    <div className="font-rounded subpixel-antialiased">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Biru | Handle gratis untuk bluesky</title>
        <meta name="title" content="Biru" />
        <meta name="description" content="Handle unik dan gratis untuk Bluesky." />

        {/* OpenGraph / FB */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bsky.makeup/" />
        <meta property="og:title" content="biru" />
        <meta property="og:description" content="Handle unik dan gratis untuk Bluesky" />
        <meta property="og:image" content="https://bsky.makeup/banner.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://bsky.makeup/" />
        <meta property="twitter:title" content="Skyname" />
        <meta property="twitter:description" content="Handle unik dan gratis untuk Bluesky"/>
        <meta property="twitter:image" content="https://bsky.makeup/banner.png" />
          
        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </div>
  )
}
