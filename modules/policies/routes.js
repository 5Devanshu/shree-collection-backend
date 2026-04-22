/**
 * Policies Routes
 * Serves Terms & Conditions, Privacy Policy, Shipping Policy, and Return Policy
 */

const express = require('express');
const router = express.Router();

// Terms and Conditions
router.get('/terms', (req, res) => {
  res.json({
    success: true,
    title: 'Terms and Conditions',
    content: {
      general: {
        title: 'General Use',
        text: 'These Terms and Conditions govern your use of this website and the purchase of products or services offered herein. By accessing or using this website, you agree to be bound by these terms. Please read them carefully. By using this website, you confirm that you are at least 18 years old or are using the website under the supervision of a parent or legal guardian.'
      },
      userResponsibilities: {
        title: 'User Responsibilities',
        text: 'Users agree not to misuse the website by knowingly introducing viruses, trojans, or other malicious material. You must not attempt to gain unauthorized access to the server, database, or any part of the site.'
      },
      productDescriptions: {
        title: 'Product & Service Descriptions',
        text: 'All efforts are made to ensure accuracy in product descriptions, images, pricing, and availability. However, we do not warrant that product descriptions or other content are complete, current, or error-free.'
      },
      orderAcceptance: {
        title: 'Order Acceptance & Cancellation',
        text: 'Placing an order on this website does not constitute a confirmed order. We reserve the right to refuse or cancel any order for reasons including but not limited to product availability, pricing errors, or suspected fraud. Once placed, orders may not be canceled or modified unless otherwise stated in the return policy.'
      },
      pricing: {
        title: 'Pricing and Payment',
        text: 'All prices are displayed in INR or the local currency and are inclusive or exclusive of taxes as indicated. Payments must be made through secure and approved payment gateways. The website is not liable for any payment gateway errors.'
      },
      intellectualProperty: {
        title: 'Intellectual Property',
        text: 'All text, graphics, logos, images, and other materials on this website are the intellectual property of their respective owners and protected by copyright and trademark laws. Unauthorized use or duplication of any materials is prohibited.'
      },
      limitationOfLiability: {
        title: 'Limitation of Liability',
        text: 'We are not responsible for any indirect or consequential damages that may arise from the use or inability to use the website or the products purchased through it. Liability is limited to the value of the product purchased, if applicable.'
      },
      governingLaw: {
        title: 'Governing Law',
        text: 'These terms shall be governed by and construed in accordance with the laws of India.'
      }
    },
    lastUpdated: '2026-04-22'
  });
});

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.json({
    success: true,
    title: 'Privacy Policy',
    content: {
      informationCollection: {
        title: 'Information We Collect',
        items: [
          'Personal Information: Name, phone number, email address, billing/shipping address.',
          'Payment Information: Used to process orders securely through third-party payment gateways.',
          'Technical Information: IP address, browser type, device information, and usage data via cookies or similar technologies.'
        ]
      },
      informationUsage: {
        title: 'How We Use Your Information',
        items: [
          'Process and deliver orders.',
          'Send transactional communications such as order updates or shipping alerts.',
          'Respond to customer inquiries or service requests.',
          'Improve website functionality, services, and user experience.',
          'Marketing purposes (only with your explicit consent).'
        ]
      },
      dataSharing: {
        title: 'Data Sharing',
        text: 'We do not sell, rent, or trade your personal data. We may share necessary information with third-party service providers such as payment gateways, delivery partners, or IT service providers — only to fulfill your order or maintain the website. Personal information may be disclosed if required by law or legal proceedings.'
      },
      dataSecurity: {
        title: 'Data Security',
        text: 'We implement reasonable security measures to protect your data from unauthorized access, alteration, or disclosure. However, no online transmission is 100% secure. You acknowledge this risk when using the site.'
      },
      cookiesAndTracking: {
        title: 'Cookies and Tracking Technologies',
        text: 'Cookies are used to personalize your experience, analyze site traffic, and provide relevant ads. You can manage or disable cookies via your browser settings, although this may affect site functionality.'
      },
      thirdPartyLinks: {
        title: 'Third-Party Links',
        text: 'This website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.'
      },
      userRights: {
        title: 'Your Rights',
        items: [
          'You may request access to or correction of your personal data.',
          'You may opt out of marketing communications at any time.'
        ]
      }
    },
    lastUpdated: '2026-04-22'
  });
});

// Shipping Policy
router.get('/shipping', (req, res) => {
  res.json({
    success: true,
    title: 'Shipping Policy',
    content: {
      orderProcessing: {
        title: 'Order Processing',
        text: 'Orders are typically processed within 1–3 business days.'
      },
      deliveryTimes: {
        title: 'Delivery Times',
        standardDelivery: '5–10 business days',
        expressDelivery: '3-5 business days',
        note: 'Tracking details are shared once the order is shipped. The business is not responsible for delays due to courier services or unforeseen circumstances.'
      }
    },
    lastUpdated: '2026-04-22'
  });
});

// Return & Refund Policy
router.get('/returns', (req, res) => {
  res.json({
    success: true,
    title: 'Return & Refund Policy',
    content: {
      returnPolicy: {
        title: 'Return Policy',
        items: [
          'Returns are accepted within 7 days of delivery for damaged or defective items.',
          'Items must be unused and returned in their original packaging.',
          'Proof of damage (photo/video) may be required for return approval.'
        ]
      },
      exchangePolicy: {
        title: 'Exchange / Replacement Policy',
        items: [
          'Exchange / replacement requests must be made within 7 days of delivery.',
          'Once approved, the exchanged / replaced product will be dispatched within 2–3 business days.',
          'Delivery timelines may vary depending on location, but typically replacements will reach you within 7–10 business days.'
        ]
      },
      refundPolicy: {
        title: 'Refund Policy',
        items: [
          'Once a return request is approved, we will process the refund within 3–5 business days.',
          'After processing, the refund will be credited to the original mode of payment within 7–10 business days, depending on the payment provider/bank.'
        ]
      }
    },
    lastUpdated: '2026-04-22'
  });
});

// Get all policies
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Policies available',
    endpoints: [
      '/api/policies/terms',
      '/api/policies/privacy',
      '/api/policies/shipping',
      '/api/policies/returns'
    ]
  });
});

module.exports = router;
