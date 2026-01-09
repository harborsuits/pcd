"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Facebook, Instagram, Linkedin, Send, Twitter, MapPin, Phone, Mail } from "lucide-react";

interface DemoFooterProps {
  businessName: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
}

export function DemoFooter({
  businessName,
  phone,
  city,
  state,
  address,
}: DemoFooterProps) {
  return (
    <footer className="relative border-t border-slate-200 bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Stay Connected</h3>
            <p className="text-sm text-slate-400">
              Join our newsletter for the latest updates and exclusive offers.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-500"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                Home
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                About Us
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                Services
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                Gallery
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                Contact
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3 text-sm text-slate-400">
              {(address || (city && state)) && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <span>
                    {address || `${city}, ${state}`}
                  </span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <a href={`tel:${phone}`} className="hover:text-white">
                    {phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>contact@{businessName.toLowerCase().replace(/\s+/g, '')}.com</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Follow Us</h3>
            <TooltipProvider>
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
                    >
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Facebook</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
                    >
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Twitter</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
                    >
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow us on Instagram</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect with us on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm md:flex-row">
          <p className="text-slate-400">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 transition-colors hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>

        {/* Demo Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            This is a demo website preview. Design and content are customizable.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default DemoFooter;
