import { Brain, MessageSquare, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Smart Product Knowledge",
    description: "Bzik scans and learns your entire product catalog, understanding every detail to provide expert-level assistance.",
    color: "text-primary",
  },
  {
    icon: MessageSquare,
    title: "Instant Customer Assistance",
    description: "Answer customer questions 24/7 with AI that understands context and delivers accurate, helpful responses.",
    color: "text-secondary",
  },
  {
    icon: Layers,
    title: "Adaptable for Any Business",
    description: "From e-commerce to services, Bzik adapts to your industry and grows with your business needs.",
    color: "text-accent",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful Features, <span className="gradient-text">Simple Setup</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to supercharge your business with AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="gradient-card border-border/50 transition-all duration-500 group"
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 transition-all duration-500`}>
                    <Icon className={`w-8 h-8 ${feature.color} transition-transform duration-300`} />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
