# Academy - Super Simple Deployment

## Step 1: Create DigitalOcean Account (2 min)

1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up (you may get $200 free credit)
3. Add payment method

## Step 2: Create a Droplet (3 min)

1. Click **"Create"** → **"Droplets"**
2. Choose:
   - **Region:** Closest to you
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Basic → Regular → **$24/mo (4GB RAM)** ← good for testing
   - **Authentication:** Password (easier) or SSH Key
3. Click **"Create Droplet"**
4. Wait 1 minute, copy the **IP address**

## Step 3: Connect to Your Server (1 min)

**On Mac/Linux:**
```bash
ssh root@YOUR_IP_ADDRESS
```

**On Windows:** Use [PuTTY](https://putty.org) or Windows Terminal:
```bash
ssh root@YOUR_IP_ADDRESS
```

Enter the password you set (or it was emailed to you).

## Step 4: Deploy Academy (5 min)

Run these commands one by one:

```bash
# Install git
apt update && apt install -y git

# Clone the repo
cd /opt
git clone https://github.com/barvolovski/academy-exam.git academy
cd academy

# Run setup
chmod +x setup-server.sh
./setup-server.sh
```

**IMPORTANT:** Save the admin password that appears on screen!

## Step 5: Done!

Your app is now running at:
- **App:** `http://YOUR_IP:3000`
- **Admin:** `http://YOUR_IP:3000/admin`

---

## Daily Commands

```bash
# SSH into your server
ssh root@YOUR_IP

# Go to app folder
cd /opt/academy

# View logs
./deploy.sh logs

# Restart
./deploy.sh restart

# Stop (saves money when not using)
./deploy.sh stop

# Start again
./deploy.sh start
```

## When You're Done Testing

**Delete the droplet to stop billing:**

1. Go to DigitalOcean dashboard
2. Click on your droplet
3. Click **"Destroy"** → **"Destroy Droplet"**
4. Billing stops immediately

---

## Cost Summary

| Usage | Cost |
|-------|------|
| 1 day | ~$0.85 |
| 1 week | ~$6 |
| 1 month | $24 |

You only pay for the time the droplet exists!

---

## Troubleshooting

### Can't connect via SSH?
- Wait 2 minutes after creating droplet
- Check you're using the right IP
- Make sure password is correct

### App not loading?
```bash
cd /opt/academy
./deploy.sh logs
```

### Need to restart everything?
```bash
cd /opt/academy
./deploy.sh stop
./deploy.sh start
```

### Forgot admin password?
```bash
cd /opt/academy
cat .env | grep ADMIN_PASSWORD
```
