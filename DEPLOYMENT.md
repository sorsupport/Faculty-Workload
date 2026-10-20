# Deploying FWL to AWS Free Tier (EC2, Ubuntu)

Everything — PostgreSQL, the Node API, and Nginx — runs as plain OS processes
on a single free-tier-eligible EC2 instance. No Docker, no managed database,
no extra AWS services, so this costs $0 as long as you stay within the Free
Tier limits noted in Part 4.

```
Browser → Nginx :80 → /          → static files (client/dist)
                     → /api/*    → Node API on 127.0.0.1:4000 (PM2) → PostgreSQL (localhost)
```

## Part 1 — AWS Console: launch the instance

1. **Sign in to the AWS Console** (console.aws.amazon.com). A Free Tier
   account needs a credit card on file, but nothing in this guide exceeds
   the limits in Part 4. Consider setting a [billing alarm](https://console.aws.amazon.com/billing/home#/budgets)
   for e.g. $1 as a safety net.

2. **Create a key pair** (used to SSH in): EC2 Console → *Key Pairs* (under
   Network & Security) → *Create key pair* → type `fwl-key`, format `.pem`
   → Create. This downloads `fwl-key.pem` — keep it safe, AWS won't let you
   download it again.

   ```bash
   chmod 400 ~/Downloads/fwl-key.pem
   ```

3. **Launch an instance**: EC2 Console → *Instances* → *Launch instances*.
   - **Name**: `fwl-server`
   - **AMI**: Ubuntu Server 22.04 LTS (or 24.04 LTS), 64-bit (x86) — marked
     "Free tier eligible"
   - **Instance type**: `t2.micro` (or `t3.micro`, whichever your region
     marks "Free tier eligible" — check the label next to the dropdown)
   - **Key pair**: `fwl-key`
   - **Network settings** → Edit → create a new security group named
     `fwl-sg` with these inbound rules:
     | Type | Port | Source |
     | --- | --- | --- |
     | SSH | 22 | My IP (not "Anywhere" — avoids random SSH scanning) |
     | HTTP | 80 | Anywhere (0.0.0.0/0) |
     | HTTPS | 443 | Anywhere (0.0.0.0/0) — fine to add now even if unused until you set up TLS |

     Do **not** add a rule for 4000 or 5432 — the API and database only
     need to be reachable from the instance itself.
   - **Storage**: default 8 GiB gp3 is enough (Free Tier covers up to 30
     GiB of EBS, so you can bump this to e.g. 20 GiB with no extra cost)
   - *Launch instance*

4. **(Recommended) Allocate an Elastic IP** so the public IP doesn't change
   if you ever stop/start the instance: EC2 Console → *Elastic IPs* →
   *Allocate Elastic IP address* → Allocate → select it → *Actions* →
   *Associate Elastic IP address* → choose `fwl-server`. An Elastic IP is
   free *while attached to a running instance* — only costs money if you
   allocate one and leave it unattached, so don't allocate one you don't
   immediately associate.

5. **Connect via SSH** using the public IP (or Elastic IP) from the
   instance's details page:

   ```bash
   ssh -i ~/Downloads/fwl-key.pem ubuntu@<instance-public-ip>
   ```

Everything below runs on the instance, over this SSH session.

## Part 2 — Install Node.js, PostgreSQL, Nginx, and PM2

```bash
sudo apt-get update
sudo apt-get upgrade -y

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL, Nginx, git
sudo apt-get install -y postgresql postgresql-contrib nginx git

# PM2 — keeps the API process alive, restarts it on crash/reboot
sudo npm install -g pm2
```

## Part 3 — Create the database

```bash
sudo -u postgres psql -c "CREATE USER fwl WITH PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE fwl OWNER fwl;"
```

Use a real generated password instead of `change-me` — e.g. `openssl rand
-hex 16` — and keep it for the `.env` file in the next step.

## Part 4 — Clone and configure the app

```bash
sudo mkdir -p /var/www/fwl
sudo chown $USER:$USER /var/www/fwl
git clone <your-repo-url> /var/www/fwl
cd /var/www/fwl
```

> If the repo is private, use a [fine-grained GitHub personal access
> token](https://github.com/settings/tokens) as the password when `git
> clone` prompts for credentials, or set up a deploy key instead.

```bash
cd server
cp .env.example .env
nano .env
```

Set in `.env`:
- `DATABASE_URL="postgresql://fwl:<your-db-password>@localhost:5432/fwl?schema=public"`
- `JWT_SECRET="<output of: openssl rand -hex 32>"`
- leave `PORT=4000` and `HOST=127.0.0.1` as-is

Then:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run seed   # optional — adds sample faculty/courses/sections
```

## Part 5 — Start the API with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

`pm2 startup` prints a `sudo env PATH=... pm2 startup systemd -u ubuntu
--hp /home/ubuntu` command — copy and run exactly that line. This is a
one-time step that makes PM2 bring the API back up automatically after a
reboot.

## Part 6 — Build the client

```bash
cd /var/www/fwl/client
npm ci
npm run build
```

This picks up `client/.env.production` (`VITE_API_BASE_URL=/api`)
automatically, so the built app calls its own origin and Nginx routes
`/api/*` to the backend.

## Part 7 — Configure Nginx

```bash
sudo cp /var/www/fwl/deploy/nginx.conf /etc/nginx/sites-available/fwl
sudo ln -s /etc/nginx/sites-available/fwl /etc/nginx/sites-enabled/fwl
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Visit `http://<instance-public-ip>` — you should see the FWL login page.
Register your first account (pick "Admin" in the role dropdown).

## Part 8 — (Optional) Automatic deploys with GitHub Actions

`.github/workflows/deploy.yml` already builds the app on every push and, on
pushes to `main`, SSHes into the instance to pull, rebuild, migrate, and
reload PM2. Add these repository secrets (GitHub repo → Settings → Secrets
and variables → Actions → New repository secret):

| Secret | Value |
| --- | --- |
| `EC2_HOST` | the instance's public IP or Elastic IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | contents of `fwl-key.pem` (the private key, in full, including the `-----BEGIN/END-----` lines) |
| `EC2_APP_DIR` | `/var/www/fwl` |

After that, every push to `main` redeploys automatically. Nginx config
changes are **not** auto-applied — repeat Part 7 by hand if you edit
`deploy/nginx.conf`.

## Part 9 — Staying within the Free Tier

- **Instance**: `t2.micro`/`t3.micro` gets 750 hours/month free for the
  first 12 months — that's enough for one instance running 24/7. Don't run
  a second instance at the same time unless you're tracking hours.
- **Storage**: up to 30 GiB of EBS (gp2/gp3) is free. The default 8–20 GiB
  here is well under that.
- **Elastic IP**: free only while attached to a *running* instance. If you
  stop the instance for an extended period, either release the Elastic IP
  or accept the (small) idle charge — don't leave one allocated and
  unattached.
- **Data transfer**: 100 GB/month outbound is free — far more than an
  internal tool like this will use.
- **No RDS, no load balancer, no NAT gateway** are used in this setup —
  all of those have free tiers too, but also much easier ways to
  accidentally incur cost, which is why this guide avoids them.
- Set a [budget alert](https://console.aws.amazon.com/billing/home#/budgets)
  for a small dollar amount so you hear about it immediately if anything
  ever falls outside Free Tier.

## Troubleshooting

- **502 Bad Gateway from Nginx**: the API isn't running or crashed. Check
  `pm2 status` and `pm2 logs fwl-server`.
- **Nginx shows the default "Welcome to nginx" page**: the site config
  isn't enabled — re-check Part 7 (`sites-enabled/fwl` must exist, and
  `sites-enabled/default` must be removed).
- **`git clone` asks for a password and rejects it**: GitHub removed
  password auth for git operations — use a personal access token (see
  Part 4's note) instead of your account password.
- **Can't SSH in**: double-check the security group's SSH rule still
  matches your current IP (home/office IPs change) and that you're using
  `chmod 400` on the `.pem` file.
