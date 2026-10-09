import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Stethoscope,
  Cpu,
  Heart,
  Waves,
  Syringe,
  Droplets,
  Zap,
  FlaskConical,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/public/Reveal";
import logo from "@/assets/laser-grafix-logo-transparent.png";
import heroImage from "@/assets/hero-skin.jpg";
import clinicImage from "@/assets/clinic-interior.jpg";
import result1 from "@/assets/result-1.jpg";
import result2 from "@/assets/result-2.jpg";
import result3 from "@/assets/result-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Laser Grafix — Aesthetic Skin Clinic in Peshawar" },
      {
        name: "description",
        content:
          "Laser Grafix offers laser, facial, injectable and peel treatments in Peshawar. Book a consultation with our team.",
      },
      { property: "og:title", content: "Laser Grafix — Aesthetic Skin Clinic in Peshawar" },
      {
        property: "og:description",
        content:
          "Premium aesthetic skin treatments in Peshawar — laser, facials, injectables and peels.",
      },
    ],
  }),
  component: LandingPage,
});

const WHATSAPP = "923099593182"; // 0309-9593182
const CLINIC_PHONE = "0309-9593182";
const CLINIC_ADDRESS =
  "City Height Basement, Near Pull Al-Habib & Soneri Bank, Kohat Road, Peshawar";

const services = [
  {
    icon: Zap,
    name: "Laser Hair Removal",
    blurb: "Precise, comfortable sessions for face and body.",
    from: 1000,
  },
  {
    icon: Droplets,
    name: "HydraFacial",
    blurb: "Deep cleansing and hydration for an immediate glow.",
    from: 3500,
  },
  {
    icon: Sparkles,
    name: "Micro Needling",
    blurb: "Collagen induction for smoother skin texture.",
    from: 3500,
  },
  {
    icon: Syringe,
    name: "BB Glow",
    blurb: "Semi-permanent glow with an even tone.",
    from: 4000,
  },
  {
    icon: FlaskConical,
    name: "Chemical Peel",
    blurb: "Renews tone and texture over a short course.",
    from: 4000,
  },
  {
    icon: Waves,
    name: "PRP (Face & Hair)",
    blurb: "Uses your own plasma to support skin and hair.",
    from: 3000,
  },
];


const reasons = [
  { icon: Stethoscope, title: "Expert Care", text: "Qualified professionals" },
  { icon: Cpu, title: "Advanced Technology", text: "Modern equipment" },
  { icon: Heart, title: "Personalized Plans", text: "Custom treatments" },
  { icon: Sparkles, title: "Comfortable Environment", text: "Relaxing clinic experience" },
];

const results = [result1, result2, result3];

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* HERO */}
      <section id="home" className="relative min-h-[720px] overflow-hidden bg-lotus-aqua pt-16 md:min-h-[790px]">
        <img
          src={heroImage}
          alt="Client with healthy, luminous skin after treatment"
          width={1200}
          height={1408}
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-center opacity-30 md:w-[55%] md:opacity-85"
        />
        <div className="absolute inset-y-0 left-0 w-full bg-background/70 md:w-[58%]" />
        <div className="relative mx-auto flex min-h-[656px] max-w-6xl items-center px-6 py-16 md:min-h-[726px] md:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-lotus-charcoal">
              Aesthetic Skin Clinic · Peshawar
            </p>
            <h1 className="mt-6 text-[2.8rem] leading-[1.06] font-semibold md:text-[4.75rem]">
              Reveal your skin&rsquo;s <span className="text-primary">true radiance.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Skin and hair treatments with modern technology, personal consultation and clear pricing.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="lift h-12 px-7">
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
                  Book Consultation <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="lift h-12 border-lotus-charcoal bg-background/80 px-7">
                <a href="#services">Explore Treatments</a>
              </Button>
            </div>
            <div className="mt-14 flex max-w-lg flex-wrap gap-x-8 gap-y-3 border-t border-lotus-bluegray pt-6 text-xs font-semibold text-lotus-charcoal">
              <span>Laser Hair Removal</span>
              <span>Skin Treatments</span>
              <span>PRP Care</span>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="overflow-hidden bg-lotus-sage py-4 text-lotus-charcoal" aria-label="Popular treatments">
        <div className="treatment-flow gap-10 text-xs font-bold uppercase">
          {[...services, ...services].map((service, index) => (
            <span key={`${service.name}-${index}`} className="flex items-center gap-10">
              {service.name}<span className="text-primary">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" className="bg-card px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">
              Our Signature Treatments
            </h2>
            <p className="mt-4 text-muted-foreground">
              A focused menu of treatments, each planned around your skin during consultation.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.name} delay={i * 70}>
               <article className="lift h-full rounded-lg border border-border bg-background p-7">
                   <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-lotus-lilac text-primary">
                    <service.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{service.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.blurb}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-primary">
                    Starting from ₨ {service.from.toLocaleString("en-US")}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
       <section className="bg-lotus-aqua px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">
              Why Laser Grafix
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, i) => (
              <Reveal key={reason.title} delay={i * 70}>
                 <div className="h-full border-t-2 border-primary bg-card p-7 shadow-card">
                  <reason.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-semibold">{reason.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{reason.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
       <section id="results" className="bg-card px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">
              Treatment Results
            </h2>
            <p className="mt-4 text-muted-foreground">
              Results may vary. Consultation recommended.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {results.map((image, i) => (
              <Reveal key={i} delay={i * 80}>
                 <figure className="overflow-hidden rounded-lg border border-border bg-background">
                  <img
                    src={image}
                    alt={`Skin condition reference ${i + 1}`}
                    loading="lazy"
                    width={912}
                    height={912}
                    className="aspect-square w-full object-cover"
                  />
                  <figcaption className="px-5 py-4 text-xs text-muted-foreground">
                    Reference image — placeholder until clinic photos are supplied.
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
       <section id="about" className="bg-lotus-lilac/45 px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <img
              src={clinicImage}
              alt="Treatment room at the clinic"
              loading="lazy"
              width={1200}
              height={912}
               className="w-full rounded-lg border border-border object-cover shadow-card"
            />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">
              About Our Clinic
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Located in Peshawar, Laser Grafix offers aesthetic treatments in a comfortable,
              professional environment.
            </p>
             <div className="mt-10 border-l-2 border-primary pl-5">
               <p className="font-semibold text-lotus-charcoal">Skin &amp; Hair</p>
               <p className="mt-1 text-sm text-muted-foreground">Advanced Care. Visible Results.</p>
             </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
       <section id="contact" className="bg-card px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">Visit Us</h2>
            <ul className="mt-8 space-y-5 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted-foreground">{CLINIC_ADDRESS}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted-foreground">{CLINIC_PHONE}</span>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted-foreground">WhatsApp {CLINIC_PHONE}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  Mon&ndash;Sat, 11:00 AM &ndash; 8:00 PM (to be confirmed)
                </span>
              </li>
            </ul>
            <p className="mt-8 text-xs text-muted-foreground">
              Opening hours to be confirmed by the clinic.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <SiteFooter />

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="lift fixed right-5 bottom-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-lift"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}

function SiteNav({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const links = [
    ["Home", "#home"],
    ["Services", "#services"],
    ["About", "#about"],
    ["Contact", "#contact"],
  ];

  return (
     <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
       <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <a href="#home" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Laser Grafix"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
           <span className="font-display text-lg font-semibold">Laser Grafix</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden bg-primary text-primary-foreground hover:bg-primary-hover md:inline-flex"
          >
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
              Book Consultation
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-card px-6 py-4 md:hidden">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-muted-foreground"
            >
              {label}
            </a>
          ))}
          <Button
            asChild
            className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
              Book Consultation
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}

function ContactForm() {
  const [sending, setSending] = useState(false);

  return (
    <form
      className="rounded-xl border border-border bg-background p-7"
      onSubmit={(e) => {
        e.preventDefault();
        setSending(true);
        setTimeout(() => {
          setSending(false);
          (e.target as HTMLFormElement).reset();
          toast.success("Thanks! Please also message us on WhatsApp so we can reply quickly.");
        }, 400);
      }}
    >
      <h3 className="text-xl font-semibold">Send us a message</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Messages are not yet delivered by email — WhatsApp is the fastest way to reach the clinic.
      </p>
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" required placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-phone">Phone</Label>
          <Input id="c-phone" name="phone" required placeholder="03XX-XXXXXXX" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-message">Message</Label>
          <Textarea id="c-message" name="message" rows={4} placeholder="How can we help?" />
        </div>
        <Button
          type="submit"
          disabled={sending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
        >
          {sending ? "Sending…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-ink px-6 py-14 text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <img
            src={logo}
            alt="Laser Grafix"
            width={128}
            height={128}
            loading="lazy"
            className="h-14 w-auto object-contain"
          />
           <p className="mt-4 font-display text-lg font-semibold">Laser Grafix</p>
          <p className="mt-2 text-sm opacity-70">
            Skin &amp; hair clinic on Kohat Road, Peshawar.
          </p>
          <p className="mt-3 text-sm opacity-70">{CLINIC_ADDRESS}</p>
          <p className="mt-1 text-sm opacity-70">{CLINIC_PHONE}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Quick Links</p>
          <ul className="mt-3 space-y-2 opacity-70">
            <li>
              <a href="#services">Services</a>
            </li>
            <li>
              <a href="#about">About</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
            <li>
              <Link to="/admin/login">Staff Login</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Follow</p>
          <div className="mt-3 flex gap-3 opacity-80">
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <MessageCircle className="h-5 w-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-6 opacity-60">@lasergrafix</p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-xs opacity-50">
        © 2026 Laser Grafix. All rights reserved.
      </p>
    </footer>
  );
}
