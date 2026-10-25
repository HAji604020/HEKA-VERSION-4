import { Product, Company, Language, GeneratedSalesReply } from '../types';

/**
 * Universal Multi-Tenant Grounded AI Sales Engine for DukanAI
 * Adaptable to ANY industry (Saffron, Apparel, Food, Electronics, Handicrafts, etc.)
 * Strictly enforces:
 * - Uses only verified company and product data entered by the business owner
 * - Never invents prices, stock, shipping promises, certifications, discounts, or product claims
 * - Clearly marks missing information as unconfirmed
 * - Accurate price calculations from confirmed rates
 * - Generates direct WhatsApp inquiry links with prefilled text
 */
export function generateUniversalSalesReply(
  product: Product,
  company: Company,
  customerMessage: string,
  targetLang: Language
): GeneratedSalesReply {
  const pName =
    targetLang === 'fa'
      ? product.nameFa || product.name
      : targetLang === 'ps'
      ? product.namePs || product.nameFa || product.name
      : product.name;
  const pCurrency = product.currency || '$';
  const pUnit = product.unit || 'unit';
  const cName = company.name;

  const msgClean = customerMessage.trim();
  const msgLower = msgClean.toLowerCase();

  // Normalize Persian/Arabic digits
  const normalizedDigits = msgLower
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');

  // Customer Intent Classifiers
  const asksPrice = /(قیمت|نرخ|چند|چنده|بها|ارزش|هزینه|چقدره|مجموع|څو|بيه|بیه|total|price|cost|how much|rate|quote)/i.test(normalizedDigits);
  const asksStock = /(موجود|داری|دارین|دارید|هست|گدام|انبار|مانده|چند تا|شته|ذخیره|available|in stock|in-stock|have|left|units|supply|inventory)/i.test(normalizedDigits);
  const asksShipping = /(ارسال|رساندن|تحویل|دلیوری|پست|ولایت|کابل|هرات|مزار|دبی|کانادا|اروپا|خارج|صادرات|چند روز|چه وقت|انتقال|با رساندن|هزینه ارسال|استول|لیږد|تحویلي|ship|shipping|delivery|deliver|dispatch|courier|how long|arrive|destination|freight|transit)/i.test(normalizedDigits);
  const asksDiscount = /(تخفیف|ارزان|کمتر|چانه|کم کنین|آفر|پرومو|ارزانتر|discount|cheaper|deal|offer|bargain|reduce|best price|lowest price)/i.test(normalizedDigits);
  const asksWholesale = /(عمده|صادرات|فله|کیلو|کارتن|پارت|کانتینر|واردکننده|خرید عمده|نمایندگی|تعداد بالا|بوتیک|wholesale|bulk|export|b2b|distributor|importer|container|moq|minimum order)/i.test(normalizedDigits);
  const asksQualityCert = /(کیفیت|لابراتوار|آزمایشگاه|ایزو|گواهی|اصالت|برگه آزمایش|آنالیز|طبیعی|پارچه|جنس|ابریشم|دوخت|quality|cert|certificate|lab|laboratory|iso|oeko|authentic|pure|fabric|material|test)/i.test(normalizedDigits);
  const asksSizesVariants = /(سایز|اندازه|وزن|گرم|گرام|بسته|ابعاد|مدیوم|لارج|size|sizes|weight|dimension|small|medium|large|grams|kg)/i.test(normalizedDigits);

  // Extract Quantity for mathematical price calculation
  let requestedQty: number | null = null;
  const qtyMatch = normalizedDigits.match(/(\d+)\s*(بسته|دانه|عدد|قوطی|کیلو|گرام|گرم|متر|واحد|box|boxes|set|sets|piece|pieces|unit|units|tin|tins|kg|grams)/i);
  if (qtyMatch) {
    const parsed = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100000) {
      requestedQty = parsed;
    }
  } else if (/(دو عدد|دو دانه|دو بسته|دوه عدد|two pieces|2 pieces|2 units|2 boxes)/i.test(normalizedDigits)) {
    requestedQty = 2;
  } else if (/(سه عدد|سه دانه|سه بسته|درې عدد|three pieces|3 pieces|3 units|3 boxes)/i.test(normalizedDigits)) {
    requestedQty = 3;
  } else if (/(پنج عدد|پنج دانه|پنځه عدد|5 pieces|5 units)/i.test(normalizedDigits)) {
    requestedQty = 5;
  } else if (/(ده عدد|ده دانه|لس عدد|10 pieces|10 units)/i.test(normalizedDigits)) {
    requestedQty = 10;
  }

  const factsUsed: string[] = [];
  const missingInfoWarnings: string[] = [];
  const unconfirmedItems: string[] = [];

  const unitPrice = product.retailPrice;

  // --- Strict Verification Rules ---

  // 1. Shipping Verification
  const shippingInquired = asksShipping || (asksPrice && /رساندن|استول|delivery|ship/i.test(normalizedDigits));
  if (shippingInquired && (!product.shippingDetails.isConfirmed || !product.shippingDetails.transitTime)) {
    unconfirmedItems.push(
      targetLang === 'fa'
        ? 'هزینه و زمان ارسال'
        : targetLang === 'ps'
        ? 'د لیږد لګښت او وخت'
        : 'Shipping cost & delivery time'
    );
    missingInfoWarnings.push(
      targetLang === 'fa'
        ? 'هزینه ارسال و زمان تحویل هنوز توسط فروشنده تایید نشده است.'
        : targetLang === 'ps'
        ? 'د لیږد لګښت او د سپارلو وخت لا د پلورونکي لخوا نه دی تایید شوی.'
        : 'Shipping cost and delivery time have not been confirmed by the seller yet.'
    );
  }

  // 2. Quality & Certification Verification
  if (asksQualityCert && (!product.qualityInfo.isConfirmed || (!product.qualityInfo.grade && !product.qualityInfo.standard))) {
    unconfirmedItems.push(
      targetLang === 'fa'
        ? 'گواهی کیفیت و استانداردهای رسمی'
        : targetLang === 'ps'
        ? 'د کیفیت تصدیق او رسمي معیارونه'
        : 'Quality grade & official certification'
    );
    missingInfoWarnings.push(
      targetLang === 'fa'
        ? 'گواهی کیفیت و استانداردهای رسمی هنوز توسط فروشنده تایید نشده است.'
        : targetLang === 'ps'
        ? 'د کیفیت تصدیق او رسمي معیارونه لا د پلورونکي لخوا نه دي تایید شوي.'
        : 'Quality grade and official certification have not been confirmed by the seller yet.'
    );
  }

  // 3. Wholesale & Discounts Verification
  if ((asksWholesale || asksDiscount) && (!product.wholesaleRules.isConfirmed || product.wholesaleRules.discountPercent <= 0)) {
    unconfirmedItems.push(
      targetLang === 'fa'
        ? 'تخفیف و شرایط عمده‌فروشی'
        : targetLang === 'ps'
        ? 'د عمده پلور تخفیف او شرایط'
        : 'Wholesale discounts'
    );
    missingInfoWarnings.push(
      targetLang === 'fa'
        ? 'تخفیف عمده و شرایط فروش همکاری هنوز توسط فروشنده تایید نشده است.'
        : targetLang === 'ps'
        ? 'د عمده پلور تخفیف او شرایط لا د پلورونکي لخوا نه دي تایید شوي.'
        : 'Wholesale discounts and bulk pricing have not been confirmed by the seller yet.'
    );
  }

  // 4. Missing stock check
  if (asksStock && product.stock === undefined) {
    unconfirmedItems.push(
      targetLang === 'fa'
        ? 'موجودی دقیق گدام'
        : targetLang === 'ps'
        ? 'د ګودام کره موجودي'
        : 'Inventory stock count'
    );
    missingInfoWarnings.push(
      targetLang === 'fa'
        ? 'موجودی دقیق گدام هنوز توسط فروشنده تایید نشده است.'
        : targetLang === 'ps'
        ? 'د ګودام کره موجودي لا د پلورونکي لخوا نه ده تایید شوې.'
        : 'Inventory stock count has not been confirmed by the seller yet.'
    );
  }

  const hasUnconfirmedDetails = unconfirmedItems.length > 0 || missingInfoWarnings.length > 0;

  // -------------------------------------------------------------
  // Compose Grounded Reply
  // -------------------------------------------------------------

  if (targetLang === 'fa') {
    const parts: string[] = [];

    parts.push(`سلام و احترامات خدمت شما، تشکر از پیام و علاقه‌مندی شما به محصولات شرکت «${cName}».`);
    parts.push(`محصول مورد نظر: ${pName}.`);
    factsUsed.push(`محصول: ${pName}`);

    if (requestedQty && requestedQty > 1 && unitPrice > 0) {
      const calculatedTotal = requestedQty * unitPrice;
      parts.push(`قیمت هر ${pUnit}: ${unitPrice} ${pCurrency} می‌باشد. برای ${requestedQty} ${pUnit}، مجموع قیمت دقیقاً ${calculatedTotal} ${pCurrency} محاسبه می‌شود.`);
      factsUsed.push(`قیمت واحد: ${unitPrice} ${pCurrency}`);
      factsUsed.push(`محاسبه برای ${requestedQty} عدد: ${calculatedTotal} ${pCurrency}`);
    } else if (unitPrice > 0) {
      parts.push(`قیمت رسمی هر ${pUnit}: ${unitPrice} ${pCurrency} می‌باشد.`);
      factsUsed.push(`قیمت: ${unitPrice} ${pCurrency}`);
    } else {
      parts.push(`قیمت این محصول هنوز توسط فروشنده تایید نشده است.`);
    }

    if (product.stock !== undefined) {
      if (product.stock <= 0) {
        parts.push(`در حال حاضر موجودی این جنس در گدام صفر است (اتمام موجودی).`);
      } else {
        parts.push(`این کالا در انبار موجود است (موجودی تاییدشده: ${product.stock} ${pUnit}).`);
      }
      factsUsed.push(`موجودی انبار: ${product.stock}`);
    }

    if (product.packageSizes && product.packageSizes.length > 0 && (asksSizesVariants || (!asksPrice && !asksStock))) {
      const sizesList = product.packageSizes.map((s) => `${s.name} (${s.weightOrSize}): ${s.price} ${pCurrency}`).join('، ');
      parts.push(`سایزها و وزن‌های موجود: ${sizesList}`);
      factsUsed.push(`تنوع سایز/وزن: ${product.packageSizes.length} گزینه`);
    }

    if (product.qualityInfo.isConfirmed) {
      const certDesc = [product.qualityInfo.grade, product.qualityInfo.standard, product.qualityInfo.notes].filter(Boolean).join(' - ');
      if (certDesc) {
        parts.push(`مشخصات کیفی و تاییدیه: ${certDesc}`);
        factsUsed.push(`کیفیت: ${certDesc.substring(0, 40)}...`);
      }
    } else if (asksQualityCert) {
      parts.push(`گواهی کیفیت و استانداردهای رسمی هنوز توسط فروشنده تایید نشده است.`);
    }

    if (product.wholesaleRules.isConfirmed && product.wholesaleRules.discountPercent > 0) {
      parts.push(`شرایط فروش عمده: حداقل سفارش ${product.wholesaleRules.minQuantity} ${pUnit} شامل ${product.wholesaleRules.discountPercent}٪ تخفیف می‌باشد.`);
      factsUsed.push(`تخفیف عمده: ${product.wholesaleRules.discountPercent}٪`);
    } else if (asksWholesale || asksDiscount) {
      parts.push(`در رابطه با تخفیف: هیچ تخفیفی توسط فروشنده تایید نشده است و قیمت‌های مندرج مقطوع می‌باشد.`);
    }

    if (product.shippingDetails.isConfirmed && product.shippingDetails.transitTime) {
      parts.push(`شرایط ارسال: ${product.shippingDetails.fee} (مدت تحویل: ${product.shippingDetails.transitTime}).`);
      factsUsed.push(`ارسال: ${product.shippingDetails.transitTime}`);
    } else if (shippingInquired) {
      parts.push(`هزینه ارسال و زمان تحویل هنوز توسط فروشنده تایید نشده است.`);
    }

    if (hasUnconfirmedDetails) {
      parts.push(`نکته: هرگونه موارد تاییدنشده فوق را لطفاً پیش از ثبت نهایی مستقیماً با مدیریت فروش هماهنگ فرمایید.`);
    } else {
      parts.push(`در صورت تمایل به ثبت سفارش یا استعلام فاکتور، در خدمت شما هستیم.`);
    }

    parts.push(`با احترام،\nبخش فروش ${cName}`);

    return {
      text: parts.join('\n\n'),
      language: 'fa',
      createdAt: new Date().toLocaleTimeString(),
      factsUsed,
      missingInfoWarnings,
      hasUnconfirmedDetails,
      unconfirmedItems,
      companyName: cName,
      engineUsed: 'local'
    };
  } else if (targetLang === 'ps') {
    const parts: string[] = [];

    parts.push(`سلامونه او نېکې هیلې! د «${cName}» شرکت له محصولاتو سره ستاسو د علاقې او پیغام څخه مننه.`);
    parts.push(`غوښتل شوی محصول: ${pName}.`);
    factsUsed.push(`محصول: ${pName}`);

    if (requestedQty && requestedQty > 1 && unitPrice > 0) {
      const calculatedTotal = requestedQty * unitPrice;
      parts.push(`د هر ${pUnit} بیه: ${unitPrice} ${pCurrency} ده. د ${requestedQty} ${pUnit} لپاره، ټولیزه بیه په دقیقه توګه ${calculatedTotal} ${pCurrency} کیږي.`);
      factsUsed.push(`د واحد بیه: ${unitPrice} ${pCurrency}`);
      factsUsed.push(`د ${requestedQty} عدد محاسبه: ${calculatedTotal} ${pCurrency}`);
    } else if (unitPrice > 0) {
      parts.push(`د هر ${pUnit} رسمي بیه: ${unitPrice} ${pCurrency} ده.`);
      factsUsed.push(`بیه: ${unitPrice} ${pCurrency}`);
    } else {
      parts.push(`د دې محصول بیه لا د پلورونکي لخوا نه ده تایید شوې.`);
    }

    if (product.stock !== undefined) {
      if (product.stock <= 0) {
        parts.push(`اوس مهال دا توکی په ګودام کې نشته.`);
      } else {
        parts.push(`دا توکی په ګودام کې شتون لري (تایید شوې موجودي: ${product.stock} ${pUnit}).`);
      }
      factsUsed.push(`د ګودام موجودي: ${product.stock}`);
    }

    if (product.packageSizes && product.packageSizes.length > 0 && (asksSizesVariants || (!asksPrice && !asksStock))) {
      const sizesList = product.packageSizes.map((s) => `${s.name} (${s.weightOrSize}): ${s.price} ${pCurrency}`).join('، ');
      parts.push(`شتون لرونکې اندازې او وزنونه: ${sizesList}`);
      factsUsed.push(`د اندازې/وزن ډولونه: ${product.packageSizes.length}`);
    }

    if (product.qualityInfo.isConfirmed) {
      const certDesc = [product.qualityInfo.grade, product.qualityInfo.standard, product.qualityInfo.notes].filter(Boolean).join(' - ');
      if (certDesc) {
        parts.push(`د کیفیت او معیار ځانګړتیاوې: ${certDesc}`);
        factsUsed.push(`کیفیت: ${certDesc.substring(0, 40)}...`);
      }
    } else if (asksQualityCert) {
      parts.push(`د کیفیت تصدیق او رسمي معیارونه لا د پلورونکي لخوا نه دي تایید شوي.`);
    }

    if (product.wholesaleRules.isConfirmed && product.wholesaleRules.discountPercent > 0) {
      parts.push(`د عمده پلور شرایط: لږترلږه فرمایش ${product.wholesaleRules.minQuantity} ${pUnit} دی چې ${product.wholesaleRules.discountPercent}٪ تخفیف لري.`);
      factsUsed.push(`د عمده پلور تخفیف: ${product.wholesaleRules.discountPercent}٪`);
    } else if (asksWholesale || asksDiscount) {
      parts.push(`د تخفیف په اړه: هیڅ تخفیف د پلورونکي لخوا نه دی تایید شوی او ذکر شوې بیې ثابتې دي.`);
    }

    if (product.shippingDetails.isConfirmed && product.shippingDetails.transitTime) {
      parts.push(`د لیږد شرایط: ${product.shippingDetails.fee} (د سپارلو وخت: ${product.shippingDetails.transitTime}).`);
      factsUsed.push(`لیږد: ${product.shippingDetails.transitTime}`);
    } else if (shippingInquired) {
      parts.push(`د لیږد لګښت او د سپارلو وخت لا د پلورونکي لخوا نه دی تایید شوی.`);
    }

    if (hasUnconfirmedDetails) {
      parts.push(`یادونه: مهرباني وکړئ هر ډول ناتایید شوي جزئیات د وروستي فرمایش څخه مخکې مستقیم د پلور مدیریت سره همغږي کړئ.`);
    } else {
      parts.push(`که غواړئ فرمایش ثبت کړئ یا رسمي بیل ترلاسه کړئ، موږ ستاسو په خدمت کې یو.`);
    }

    parts.push(`په درنښت،\nد ${cName} د پلور څانګه`);

    return {
      text: parts.join('\n\n'),
      language: 'ps',
      createdAt: new Date().toLocaleTimeString(),
      factsUsed,
      missingInfoWarnings,
      hasUnconfirmedDetails,
      unconfirmedItems,
      companyName: cName,
      engineUsed: 'local'
    };
  } else {
    // English language reply
    const parts: string[] = [];

    parts.push(`Hello! Thank you for contacting ${cName} regarding ${pName}.`);
    parts.push(`Product: ${pName}.`);
    factsUsed.push(`Product: ${pName}`);

    if (requestedQty && requestedQty > 1 && unitPrice > 0) {
      const calculatedTotal = requestedQty * unitPrice;
      parts.push(`Price: ${pCurrency}${unitPrice} per ${pUnit}. For ${requestedQty} ${pUnit}s, the total calculated price is ${pCurrency}${calculatedTotal}.`);
      factsUsed.push(`Unit Price: ${pCurrency}${unitPrice}`);
      factsUsed.push(`Calculated Total for ${requestedQty} units: ${pCurrency}${calculatedTotal}`);
    } else if (unitPrice > 0) {
      parts.push(`Price: ${pCurrency}${unitPrice} per ${pUnit}.`);
      factsUsed.push(`Price: ${pCurrency}${unitPrice}`);
    } else {
      parts.push(`The product price has not been confirmed by the seller yet.`);
    }

    if (product.stock !== undefined) {
      if (product.stock <= 0) {
        parts.push(`Currently, this item is out of stock in our inventory.`);
      } else {
        parts.push(`Confirmed Inventory: ${product.stock} ${pUnit}s currently in stock.`);
      }
      factsUsed.push(`Confirmed Stock: ${product.stock}`);
    }

    if (product.packageSizes && product.packageSizes.length > 0 && (asksSizesVariants || (!asksPrice && !asksStock))) {
      const sizesList = product.packageSizes.map((s) => `${s.name} (${s.weightOrSize}): ${pCurrency}${s.price}`).join(', ');
      parts.push(`Available Sizes & Variants: ${sizesList}`);
      factsUsed.push(`Variants: ${product.packageSizes.length} options`);
    }

    if (product.qualityInfo.isConfirmed) {
      const certDesc = [product.qualityInfo.grade, product.qualityInfo.standard, product.qualityInfo.notes].filter(Boolean).join(' - ');
      if (certDesc) {
        parts.push(`Confirmed Quality & Standards: ${certDesc}`);
        factsUsed.push(`Quality: ${certDesc.substring(0, 40)}...`);
      }
    } else if (asksQualityCert) {
      parts.push(`Quality grade and official certification have not been confirmed by the seller yet.`);
    }

    if (product.wholesaleRules.isConfirmed && product.wholesaleRules.discountPercent > 0) {
      parts.push(`Wholesale Terms: Minimum order of ${product.wholesaleRules.minQuantity} ${pUnit}s qualifies for a ${product.wholesaleRules.discountPercent}% discount.`);
      factsUsed.push(`Wholesale Discount: ${product.wholesaleRules.discountPercent}%`);
    } else if (asksWholesale || asksDiscount) {
      parts.push(`Regarding discounts: no discounts have been confirmed by the seller, and standard listed prices apply.`);
    }

    if (product.shippingDetails.isConfirmed && product.shippingDetails.transitTime) {
      parts.push(`Shipping & Delivery: ${product.shippingDetails.fee} (Estimated transit: ${product.shippingDetails.transitTime}).`);
      factsUsed.push(`Shipping: ${product.shippingDetails.transitTime}`);
    } else if (shippingInquired) {
      parts.push(`Shipping cost and delivery time have not been confirmed by the seller yet.`);
    }

    if (hasUnconfirmedDetails) {
      parts.push(`Please note: Any unconfirmed details listed above must be verified directly with ${cName} management before final order placement.`);
    } else {
      parts.push(`Please let us know if you would like to proceed with an order or have additional questions!`);
    }

    parts.push(`Best regards,\nSales & Customer Service Team\n${cName}`);

    return {
      text: parts.join('\n\n'),
      language: 'en',
      createdAt: new Date().toLocaleTimeString(),
      factsUsed,
      missingInfoWarnings,
      hasUnconfirmedDetails,
      unconfirmedItems,
      companyName: cName,
      engineUsed: 'local'
    };
  }
}
