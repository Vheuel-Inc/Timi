# Biru
Daftarkan dan miliki nama pengguna unik dan gratis Anda sendiri untuk Bluesky 

## Kenapa?
Biru adalah pendaftar nama pengguna untuk Bluesky. 

Bluesky menggunakan domain sebagai nama pengguna. Karena saya pemilik domain vheuel.com, saya dapat menetapkannya sebagai nama pengguna saya di Bluesky, itulah sebabnya saya @vheuel.com. 

DNS, khususnya data TXT, digunakan untuk memverifikasi kepemilikan domain. Biru membajak proses ini dan memungkinkan pengguna memverifikasi subdomain pada sekumpulan nama domain yang dimiliki oleh siapa pun yang menjalankan instance Biru. 

Instance resmi Biru terletak di [bsky.makeup](https://bsky.makeup). Anda dapat menemukan domain seperti bsky.today dan skeets.top. Siapa pun dapat mendaftar dan mengklaim miliknya sendiri<username> Nama pengguna .bsky.makeup gratis dan selamanya. 

Jika Anda ingin menambahkan domain Anda sendiri agar dapat digunakan oleh siapa saja, kirim email ke [contact@vheuel.com](mailto:contact@vheuel.com) untuk memulai prosesnya. 

## Setup
Clone down the repo and install dependencies:
```
git clone git@github.com:vheuel/biru.git
cd biru
yarn
```

You will need to populate `BIRU_CONFIG` with a Base64 encoded JSON object to supply your owned domains and DNS providers. Here is a sample:
```json
{
    "domains": {
        "example.com": {
            "provider": "my-provider",
            "zoneId": "<cf_zone_id>",
            "disallowedSubdomains": [
                "vheuel"
            ]
        }
    },
    "providers": {
        "my-provider": {
            "service": "cloudflare",
            "token": "<cf_token>",
            "attestation": {
                "verified": true
            }
        }
    }
}
```

Once you have this file, save it to `config.json` and run the following command to copy the encoded Base64 string to clipboard so you can set as your `BIRU_CONFIG` environment variable:
```
cat config.json | base64 | pbcopy -
```

You will also need to set `POSTGRES_URL` to a PostgreSQL database. The database must have read write permissions and a table called `registrations` which can be created using the following SQL query:
```sql
CREATE TABLE "public"."registrations" (
    "id" varchar NOT NULL,
    "created_at" text NOT NULL DEFAULT now(),
    "invalidated_at" text,
    "actor" varchar NOT NULL,
    "subdomain" varchar NOT NULL,
    "domain" varchar NOT NULL,
    "previous_username" varchar NOT NULL,
    "record_id" varchar NOT NULL,
    "server" varchar NOT NULL DEFAULT 'bsky.social'::character varying,
    PRIMARY KEY ("id")
);
```

You can optionally set a `TG_CHAT_ID` and `TG_BOT_TOKEN` which will log events out to a Telegram chat.

### Development
To run the server locally, make sure you have added the above environment variables to `.env.local` in the repository root. Then you can run the following:
```
yarn dev
```

## License
MIT
