import { BzikCharacter } from "./BzikCharacter";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const partners = [
  { name: "Shopify", logo: "🛍️" },
  { name: "Stripe", logo: "💳" },
  { name: "Slack", logo: "💬" },
  { name: "Salesforce", logo: "☁️" },
  { name: "HubSpot", logo: "📊" },
  { name: "Zapier", logo: "⚡" },
  { name: "Mailchimp", logo: "📧" },
  { name: "Google Workspace", logo: "📱" },
];

export const PartnersSection = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="font-heading text-5xl md:text-6xl font-bold gradient-text">
            BOTH Power: Bzik + Your Business
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
            Bzik adapts to startups and enterprises alike — seamlessly integrating with your favorite tools
          </p>
        </div>

        <div className="relative">
          {/* Partners Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {partners.map((partner, index) => (
                <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <div className="group relative border border-primary/20 rounded-xl p-8 h-32 flex flex-col items-center justify-center gap-3 transition-all duration-500 cursor-pointer gradient-card transform-3d">
                      <span className="text-5xl transition-all duration-500 transform-3d">
                        {partner.logo}
                      </span>
                      <p className="text-sm font-medium text-muted-foreground">
                        {partner.name}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
