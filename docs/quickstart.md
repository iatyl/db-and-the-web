# Quick Start

## Dependencies

Latest Docker and Docker Compose are required. If you are on WSL, please set up Docker CLI accordingly.

## Clone the Repo

Clone the repo with git.

```bash
git clone git@github.com:iatyl/db-and-the-web.git
cd db-and-the-web
```

## Configuration

Edit the `.env.sample` file to your needs, and rename it to `.env`: Just make sure `DEBUG` is `yes` here, so `Express` won't enforce HTTPS cookies.
```bash
cp .env.sample .env
vim .env
```

`VIRUS_TOTAL_API_KEY` is mandatory and requires a VirusTotal(https://www.virustotal.com) account.

## Development Server

Run with `docker compose`:

```bash
docker compose up
```

Your server will soon be available at http://127.0.0.1:8000

# Production Setup

## Dotenv

In your `.env` file, the following variables are important. You should generate your own `SESSION_SECRET` using a password generator.

```bash
AUTO_RELOAD=no
DEBUG=no
SESSION_SECRET=ieSaegheid1ahg9Chae7ohriBail5reiphoa5ohj0joh1Oor1Ee6auyee1hongeiKahgaelamaiNgahv0thogheuquoozoogohgh
```

## Get Caddy

### Normal Installation

First, install the caddy package (`.deb` or `.rpm`) correctly from https://caddyserver.com/

### Stop Caddy

Stop caddy for now:

```bash
sudo systemctl stop caddy
```

### Caddyfile

Copy my Caddyfile and edit it correctly:

```bash
sudo cp ./config/Caddyfile /etc/caddy
sudo vim /etc/caddy/Caddyfile
```

### Build Caddy with Plugins

You probably need to install `golang` and set it up, and then install `xcaddy` following the instructions on https://caddyserver.com/

When you have `xcaddy` in your path, build caddy with plugins:

```bash
xcaddy build --with github.com/porech/caddy-maxmind-geolocation --with github.com/RussellLuo/caddy-ext/ratelimit
```

Replace old caddy:

```bash
sudo mv /usr/bin/caddy /usr/bin/caddy.old && sudo mv caddy /usr/bin/caddy
```

### MaxMind Database

`GeoLite2-City.mmdb` can be aquired from [maxmind](https://maxmind.com), which may require a free account.

### Let's Go!

Run caddy, and your server will be ready:

```bash
sudo systemctl enable --now caddy
```
