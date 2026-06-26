# TableOrders Contract Checklist

Working document for tracking pre- and post-signing tasks. Not part of the signed agreement.

---

**Before signing:**
- [x] GbR exact registered legal name, registered office address, authorized
  representative name and role → Camus & Majidi-Shad GbR, Leinestraße 54 12049 Berlin, Niusha Majidi Inhaberin
- [x] Client German VAT identification number → DE347196143
- [ ] Provider French intra-community VAT number → pending; call SIE before issuing first invoice on 1 July
- [x] Provider and Client email addresses for legal notices → added to preamble
- [x] Effective date and billing start date → 26 June 2026 / 1 July 2026
- [x] Confirm subscription start date triggers first invoice → Section 3 confirmed


**Hosting setup (before production):**
- [x] Hosting provider confirmed: Hetzner Cloud → updated throughout contract and
  DPA sub-processors
- [ ] Client creates Hetzner account and grants Provider SSH/console access
- [ ] Client registers or transfers domain; Provider assists with DNS setup
- [ ] Hetzner Object Storage bucket created under Client account for backups
- [x] Backup minimums agreed and documented: daily automated SQLite dump, 30-day
  retention, stored in Hetzner Object Storage, Provider notifies Client if backup
  fails for more than 48 hours → formalised in Section 6


**Scope and DPA:**
- [x] Schedule 1: Launch Scope drafted and attached → see Schedule 1
- [x] Personal data confirmed in scope (staff Directus accounts; incidental
  identifiable notes); customer names, reservations, loyalty, and delivery data
  NOT collected → DPA scoped accordingly
- [x] Annex A: Data Processing Agreement drafted → see Annex A
- [ ] Both parties review and confirm Annex A before production deployment


**After signing:**
- [ ] Provider invoices for first billing period on agreed start date (1 July 2026)
- [ ] Onboarding session scheduled (Berlin, on-site)
