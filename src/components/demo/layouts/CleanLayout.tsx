import { MapPin, Star, Phone, Quote, Award, Users, Calendar, CheckCircle, Wrench, Shield, Clock, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { getHeroImage, getGalleryImagesForBusiness, getInitials } from "../themes";
import { getTradeDisplayName, getTradeCTAText, isKnownTrade } from "@/lib/categoryServices";
import { getTradeIcon } from "@/lib/tradeIcons";
import { getStableTestimonials } from "@/lib/testimonials";
import { LampContainer } from "@/components/ui/lamp";
import { 
  HoverSlider, 
  TextStaggerHover, 
  HoverSliderImageWrap, 
  HoverSliderImage 
} from "@/components/ui/animated-slideshow";
import { AboutSection } from "@/components/ui/about-section";
import { DemoFooter } from "@/components/ui/demo-footer";

interface LayoutProps {
  templateType: string;
  content: Record<string, unknown>;
  businessName: string;
  onQuoteClick: () => void;
}

export function CleanLayout({ templateType, content, businessName, onQuoteClick }: LayoutProps) {
  const city = (content.city as string) || "your area";
  const state = (content.state as string) || "";
  const services = (content.services as string[]) || [];
  const phone = content.phone as string;
  const rating = (content.rating as number) || null;
  const reviewCount = (content.reviewCount as number) || null;
  const tagline = (content.tagline as string) || "";
  const photoReferences = (content.photoReferences as string[]) || [];
  const address = content.address as string;
  
  const heroResult = getHeroImage({ templateType, businessName });
  const heroImage = heroResult.heroImage;
  const galleryResult = getGalleryImagesForBusiness({
    templateType,
    businessName,
    city,
    count: 6,
    excludeHero: heroImage,
    photoReferences,
  });
  const galleryImages = galleryResult.images;
  const locationString = state ? `${city}, ${state}` : city;
  const nearbyTowns = (content.nearbyTowns as string[]) || [];

  // Trade-aware content
  const tradeName = getTradeDisplayName(templateType);
  const knownTrade = isKnownTrade(templateType);
  const ctaText = getTradeCTAText(templateType);
  const heroSubheadline = knownTrade 
    ? `Professional ${tradeName} Services in ${locationString}`
    : `Professional Services in ${locationString}`;
  const testimonials = getStableTestimonials({ businessName, city, templateType, count: 1 });
  const TradeIcon = getTradeIcon(templateType);

  // Prepare services for HoverSlider (max 5 items with images)
  const slideshowServices = services.slice(0, Math.min(5, galleryImages.length)).map((service, index) => ({
    id: `service-${index}`,
    title: service,
    imageUrl: galleryImages[index] || heroImage,
  }));

  // Prepare services for AboutSection
  const aboutServices = services.slice(0, 6).map((service, index) => ({
    icon: index % 4 === 0 ? <Wrench className="h-5 w-5" /> : 
          index % 4 === 1 ? <Shield className="h-5 w-5" /> :
          index % 4 === 2 ? <Clock className="h-5 w-5" /> :
          <ThumbsUp className="h-5 w-5" />,
    title: service,
    description: `Professional ${service.toLowerCase()} services delivered with expertise and attention to detail. We ensure quality results every time.`,
  }));

  // Stats for AboutSection
  const stats = [
    { icon: <Star className="h-5 w-5" />, value: rating ? Math.round(rating * 10) / 10 * 20 : 98, label: "Satisfaction Rate", suffix: "%" },
    { icon: <Users className="h-5 w-5" />, value: reviewCount || 150, label: "Happy Clients", suffix: "+" },
    { icon: <Calendar className="h-5 w-5" />, value: 10, label: "Years Experience", suffix: "+" },
    { icon: <Award className="h-5 w-5" />, value: services.length || 8, label: "Services Offered", suffix: "" },
  ];

  return (
    <div className="bg-slate-950">
      {/* Hero Section with Lamp Effect */}
      <LampContainer className="min-h-[80vh] bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          {/* Trade icon badge */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/30">
              <TradeIcon className="w-8 h-8" />
            </div>
          </div>

          <h1 className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
            {businessName}
          </h1>
          
          <p className="mt-4 text-lg text-blue-400 font-medium md:text-xl">
            {heroSubheadline}
          </p>
          
          {tagline && (
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              {tagline}
            </p>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700">
              <MapPin className="w-4 h-4 text-blue-400" />
              {locationString}
            </span>
            {rating && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-300 border border-slate-700">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {rating.toFixed(1)} {reviewCount && `(${reviewCount} reviews)`}
              </span>
            )}
            {phone && (
              <a 
                href={`tel:${phone}`} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {phone}
              </a>
            )}
          </div>

          {/* CTA Button */}
          <button 
            onClick={onQuoteClick}
            className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25"
          >
            {ctaText.button}
          </button>
        </motion.div>
      </LampContainer>

      {/* Services Slideshow Section */}
      {slideshowServices.length > 0 && (
        <section className="bg-white py-20 md:py-28">
          <HoverSlider className="container mx-auto px-4">
            <div className="mb-8">
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                / our services
              </span>
            </div>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 lg:w-1/2">
                {slideshowServices.map((slide, index) => (
                  <TextStaggerHover
                    key={slide.id}
                    text={slide.title}
                    index={index}
                  />
                ))}
              </div>
              
              <HoverSliderImageWrap className="lg:w-2/5">
                {slideshowServices.map((slide, index) => (
                  <div key={slide.id} className="relative">
                    <HoverSliderImage
                      index={index}
                      imageUrl={slide.imageUrl}
                    />
                  </div>
                ))}
              </HoverSliderImageWrap>
            </div>
          </HoverSlider>
        </section>
      )}

      {/* About Section with Stats */}
      <AboutSection
        businessName={businessName}
        tagline={tagline || `We are dedicated to providing the highest quality ${tradeName.toLowerCase()} services in ${locationString}. Our team brings years of experience and a commitment to excellence to every project.`}
        services={aboutServices}
        stats={stats}
        centerImageUrl={galleryImages[0] || heroImage}
        onCtaClick={onQuoteClick}
        ctaText={ctaText.button}
      />

      {/* Testimonial Section */}
      <section className="bg-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-4 block">
              What Our Clients Say
            </span>
            
            {testimonials.map((t, i) => (
              <div key={i} className="relative mt-8">
                <Quote className="w-12 h-12 text-blue-500/20 mx-auto mb-6" />
                
                {/* Star rating */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star key={starIndex} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-6">
                  "{t.quote}"
                </blockquote>
                <cite className="text-slate-400 not-italic">
                  — {t.author}
                </cite>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area Section */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"
                  >
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                ))}
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Proudly Serving {city}
            </h2>
            
            {nearbyTowns.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {nearbyTowns.slice(0, 6).map((town, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-white rounded-full text-sm text-slate-600 border border-slate-200"
                  >
                    {town}
                  </span>
                ))}
              </div>
            )}
            
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Now: {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {ctaText.heading}
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Fast response • Licensed & Insured • Satisfaction Guaranteed
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onQuoteClick}
              className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              {ctaText.button}
            </button>
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="px-8 py-4 bg-blue-800/50 text-white rounded-full font-semibold hover:bg-blue-800 transition-colors border border-blue-400/30"
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Call {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <DemoFooter
        businessName={businessName}
        phone={phone}
        city={city}
        state={state}
        address={address}
      />
    </div>
  );
}
