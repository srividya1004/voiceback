# MongoDB Production Network & Security Deployment Specification

## Executive Summary

This document specifies the network architecture and security configuration required to ensure that the VoiceBack application operates with complete MongoDB network independence in production.

---

## 1. Verified Architecture Model

```
┌─────────────────────────────────────────────────────────┐
│                    END USER TIER                        │
│  Patient, Caregiver, & Doctor PWA / Mobile Devices      │
│  (Connected via 4G/5G, Home Wi-Fi, Hospital Wi-Fi, etc.)│
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTPS REST API Requests ONLY
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PRODUCTION BACKEND                    │
│  VoiceBack Node.js / Express Cloud Server               │
│  (Fixed Outbound Egress IP / NAT Gateway / Elastic IP)  │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ TLS Encrypted Mongoose Connection
                             │ (Filtered by Backend IP in Atlas Allowlist)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  DATABASE STORAGE TIER                  │
│  MongoDB Atlas Cloud Database Cluster                   │
│  (Atlas Network Access: Production Backend IP Only)     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Audit Verification & Findings

1. **Frontend Isolation (Pass)**:
   - The PWA (`pwa/src/`) contains **zero** database connection strings, credentials, or Mongoose driver imports.
   - PWA clients communicate exclusively with the backend REST API (`/api/...`).
   - Patients, caregivers, and doctors can access VoiceBack from **any network** without adding their client IP addresses to MongoDB Atlas.

2. **Current Development vs Production Dependency Audit**:
   - **Local Development State**: Currently, the backend runs on the developer's local machine (`localhost:5000`). Database access during local testing relies on the local machine's public IP being present in MongoDB Atlas IP Access List (or falling back to local `MongoMemoryServer` during offline unit tests).
   - **Production Backend State**: When the backend is deployed to a cloud hosting platform (e.g. AWS, Render, Heroku, DigitalOcean), the production server executes in the cloud environment. Backend database connection depends **strictly** on the cloud host's outbound IP, completely independent of the developer's personal local IP.

3. **No `0.0.0.0/0` Production Workaround**:
   - Allowing `0.0.0.0/0` (access from anywhere) opens database ports to the global public Internet and is **forbidden** for production deployment.

---

## 3. Required Deployment Steps for Backend Hosting

When deploying the VoiceBack Express backend to production, execute the following network configuration steps based on your cloud provider:

### Step 1: Assign a Fixed Outbound Public IP to Backend Cloud Host
- **AWS (EC2 / Beanstalk / ECS)**: Route outbound traffic through an AWS NAT Gateway attached to a **Static Elastic IP (EIP)**.
- **Render / Heroku / DigitalOcean**: Retrieve the dedicated outbound IP addresses provided by the platform (or attach a Static Reserved IP).
- **GCP (Cloud Run / GAE)**: Route egress traffic through a **Cloud NAT** with a static external IP.

### Step 2: Configure MongoDB Atlas IP Access List
1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Navigate to **Network Access** under Security.
3. Click **Add IP Address**.
4. Enter the **Static Outbound Public IP** of the production backend server.
5. Save the configuration.

### Step 3: Enterprise Option — AWS PrivateLink / VPC Peering (Alternative)
- For high-security enterprise hosting, establish **AWS PrivateLink** or **VPC Peering** between the backend AWS VPC and MongoDB Atlas VPC.
- Connection traffic routes over private IP addresses (`10.x.x.x`) without crossing the public Internet.

### Step 4: Environment Variable Management
- Store `MONGODB_URI` exclusively in the production backend hosting provider's Environment Secret Manager (e.g., AWS Secrets Manager, Render Environment Variables).
- Never commit production database connection strings or passwords into git repositories or client bundles.

---

## 4. Deployment Verification Checklist

- [x] Client PWA makes 0 direct database connections.
- [x] No `MONGODB_URI` string exists in `pwa/` build outputs.
- [x] Backend API brokers all Patient, Doctor, Caregiver, and EMG profile data.
- [ ] Production Backend Cloud Host provisioned with Static Outbound IP.
- [ ] MongoDB Atlas Network Access configured with Production Backend Static IP.
- [ ] `0.0.0.0/0` disabled in production Atlas cluster.
