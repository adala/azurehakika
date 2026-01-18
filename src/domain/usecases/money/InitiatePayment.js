const { v4: uuidv4 } = require('uuid');

class InitiatePayment {
  constructor({ paymentRepository, invoiceRepository, requestRepository, userRepository, flutterwaveService }) {
    this.paymentRepository = paymentRepository;
    this.invoiceRepository = invoiceRepository;
    this.requestRepository = requestRepository;
    this.userRepository = userRepository;
    this.flutterwaveService = flutterwaveService;
  }

  async execute(requestId, userId) {
    // Get request
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Verify ownership
    if (request.userId !== userId) {
      throw new Error('Unauthorized to pay for this request');
    }

    // Get user to check tier
    const user = await this.userRepository.findById(userId);

    // Auto-quote for professional/enterprise tier if not already quoted
    if ((!request.quotedPrice || request.quotedPrice <= 0)) {
      // Professional and Enterprise tiers get automatic pricing
      if (user.tier === 'professional' || user.tier === 'enterprise') {
        // Use basePrice from service
        if (request.service && request.service.basePrice) {
          request.quotedPrice = request.service.basePrice;
          // Update request with quoted price and change status to 'quoted'
          await this.requestRepository.update(requestId, {
            quotedPrice: request.service.basePrice,
            status: 'quoted'
          });
        } else {
          throw new Error('Service pricing not available');
        }
      } else {
        // Basic tier requires manual quote from staff
        throw new Error('Request has not been quoted yet. Please wait for our team to provide a quote.');
      }
    }

    // Check if already paid
    if (request.status === 'in_progress' || request.status === 'completed') {
      throw new Error('This request has already been paid');
    }

    // Get or create invoice
    let invoice = await this.invoiceRepository.findByRequestId(requestId);
    
    if (!invoice) {
      // Auto-generate invoice
      const invoiceNumber = await this.invoiceRepository.getNextInvoiceNumber();
      const amount = parseFloat(request.quotedPrice);
      const taxAmount = 0; // Add tax calculation if needed
      const totalAmount = amount + taxAmount;
      
      // Set due date to 7 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      invoice = await this.invoiceRepository.create({
        id: uuidv4(),
        requestId: requestId,
        userId: userId,
        invoiceNumber: invoiceNumber,
        amount: amount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        currency: 'GHS',
        status: 'unpaid',
        dueDate: dueDate,
        notes: `Invoice for ${request.service ? request.service.name : 'Background Screening Service'}`
      });
    }

    // Create payment record (user already fetched above)
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    const payment = await this.paymentRepository.create({
      id: uuidv4(),
      requestId: requestId,
      userId: userId,
      amount: invoice.totalAmount,
      currency: 'GHS',
      paymentMethod: 'flutterwave',
      reference: reference,
      status: 'pending'
    });

    // Initialize Flutterwave payment
    const callbackUrl = `${process.env.PAYMENT_CALLBACK_URL || 'http://localhost:3000/payments/callback'}?reference=${reference}`;
    
    const paymentLink = await this.flutterwaveService.getPaymentLink({
      reference: reference,
      amount: invoice.totalAmount,
      currency: 'GHS',
      customerEmail: user.email,
      customerName: user.name,
      customerPhone: user.phone || '',
      redirectUrl: callbackUrl,
      description: `Payment for ${invoice.invoiceNumber}`,
      requestId: requestId,
      userId: userId
    });

    return {
      payment,
      invoice,
      paymentLink
    };
  }
}

module.exports = InitiatePayment;
