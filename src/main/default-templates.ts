/**
 * Default invoice format templates
 */

// GST Template
export const DEFAULT_TEMPLATE_NAME = 'Standard GST Invoice';
export const DEFAULT_TEMPLATE_DESCRIPTION =
  'A professional GST-compliant invoice template with company and customer details, itemized billing, and tax summary.';

// Non GST Template
export const NON_GST_TEMPLATE_NAME = 'Non GST Invoice';
export const NON_GST_TEMPLATE_DESCRIPTION =
  'A professional invoice template for businesses without GST registration. Clean layout without GST-specific fields.';

export const DEFAULT_HTML_TEMPLATE = `<% if (invoice.status === 'CANCELLED') { %>
<div class="cancelled-banner">CANCELLED</div>
<% } %>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td class="title">GST INVOICE</td>
  </tr>
  <tr>
    <td style="font-size: 12px;">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="3" cellspacing="0" width="100%">
  <tr>
    <td valign="top" class="width-50">
      <span class="org_name"><%= company.name %></span><br/>
      <% if (company.profession) { %>
      <span class="profession"><%= company.profession %></span><br/>
      <% } %>
      <% if (company.addressLine1) { %><%= company.addressLine1 %><br/><% } %>
      <% if (company.addressLine2) { %><%= company.addressLine2 %><br/><% } %>
      <%= company.city %><% if (company.pinCode) { %> - <%= company.pinCode %><% } %><br/>
      <%= company.state %> (<%= company.stateCode %>)<br/>
      <% if (company.phone) { %>Ph.: <%= company.phone %><br/><% } %>
      <% if (company.email) { %>Email: <%= company.email %><br/><% } %>
      <% if (company.gstin) { %><b>GSTIN:</b> <%= company.gstin %><br/><% } %>
      <% if (company.pan) { %><b>PAN:</b> <%= company.pan %><% } %>
    </td>
    <td valign="top" class="width-50">
      <p class="recipient_det">RECIPIENT'S DETAIL</p>
      <span class="bold cname"><%= customer.name %></span><br/>
      <% if (customer.addressLine1) { %><%= customer.addressLine1 %><br/><% } %>
      <% if (customer.addressLine2) { %><%= customer.addressLine2 %><br/><% } %>
      <% if (customer.city) { %><%= customer.city %><% if (customer.pinCode) { %> - <%= customer.pinCode %><% } %><br/><% } %>
      <% if (customer.state) { %><%= customer.state %> (<%= customer.stateCode %>)<br/><% } %>
      <% if (customer.phone) { %>Ph.: <%= customer.phone %><br/><% } %>
      <% if (customer.email) { %>Email: <%= customer.email %><br/><% } %>
      <% if (customer.gstin) { %><b>GSTIN:</b> <%= customer.gstin %><br/><% } %>
      <% if (customer.pan) { %><b>PAN:</b> <%= customer.pan %><% } %>
    </td>
  </tr>

  <tr>
    <td colspan="2">&nbsp;</td>
  </tr>

  <tr>
    <td class="inv width-50"><b>Invoice No.:</b> <%= invoice.invoiceNumber %></td>
    <td class="inv width-50"><b>Invoice Date:</b> <%= invoice.invoiceDate %></td>
  </tr>

  <tr>
    <td colspan="2">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="4" cellspacing="0" width="100%">
  <tr class="table-header">
    <td class="align-center brdL brdT brdB width-less bold" width="10%">Sl No.</td>
    <td class="align-center padding-3 brdL brdT brdB bold" width="40%">Description</td>
    <td class="align-center padding-3 brdL brdT brdB bold" width="10%">HSN/SAC</td>
    <td class="align-center padding-3 brdL brdT brdB bold" width="15%">Rate</td>
    <td class="align-center padding-3 brdL brdR brdT brdB bold" width="15%">Amount (<%= currencySymbol %>)</td>
  </tr>

  <% items.forEach(function(item) { %>
  <tr>
    <td class="align-center padding-3 brdL"><%= item.index %></td>
    <td class="padding-3 brdL">
      <%= item.name %>
      <% if (item.description) { %><br/><span class="item-description"><%= item.description %></span><% } %>
    </td>
    <td class="align-center padding-3 brdL"><%= item.hsnCode || '-' %></td>
    <td class="align-right padding-3 brdL"><%= item.rateFormatted %></td>
    <td class="align-right padding-3 brdL brdR"><%= item.amountFormatted %></td>
  </tr>
  <% }); %>

  <tr>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-right padding-3 brdL brdR brdB">&nbsp;</td>
  </tr>

  <tr>
    <td class="align-right padding-3 brdL brdB bold" colspan="4">Amount Before Taxes &amp; Discounts</td>
    <td class="align-right padding-3 brdL brdR brdB bold"><%= invoice.taxableTotalFormatted %></td>
  </tr>

  <% taxSummary.forEach(function(tax) { %>
  <tr>
    <td class="align-right padding-3 brdL brdB" colspan="4"><%= tax.name %></td>
    <td class="align-right padding-3 brdL brdR brdB"><%= tax.amountFormatted %></td>
  </tr>
  <% }); %>

  <% taxDiscountEntries.forEach(function(entry) { %>
  <tr>
    <td class="align-right padding-3 brdL brdB" colspan="4">
      <%= entry.name %><% if (entry.rateType === 'PERCENT') { %> @ <%= entry.rate %>%<% } %>
    </td>
    <td class="align-right padding-3 brdL brdR brdB">
      <% if (entry.entryType === 'DISCOUNT') { %>-<% } %><%= entry.amountFormatted %>
    </td>
  </tr>
  <% }); %>

  <tr>
    <td class="align-right padding-3 brdL brdB bold" colspan="4">Total</td>
    <td class="align-right padding-3 brdL brdR brdB bold"><%= invoice.grandTotalFormatted %></td>
  </tr>
</table>

<table border="0" cellpadding="4" cellspacing="0" width="100%">
  <tr>
    <td class="brdL brdB padding-3 bold align-center" width="20%">Rupees (In Words)</td>
    <td class="brdL brdB padding-3 brdR" colspan="4"><%= invoice.grandTotalInWords %></td>
  </tr>

  <tr>
    <td colspan="4">&nbsp;</td>
    <td class="align-center" style="width:15%">
      <% if (invoice.status === 'PAID') { %>Paid<% } else if (invoice.status === 'PARTIALLY_PAID') { %>Partially Paid<% } else if (invoice.status === 'UNPAID') { %>Unpaid<% } else if (invoice.status === 'CANCELLED') { %><span class="status-cancelled">Cancelled</span><% } %>
    </td>
  </tr>

  <tr>
    <td class="colspan="5" class="padding-3""><b>Reverse Charge:</b> <%= invoice.reverseChargeText %></td>
  </tr>

  <% if (invoice.notes) { %>
  <tr>
    <td colspan="5" class="padding-3">
      <b>Notes:</b> <%= invoice.notes %>
    </td>
  </tr>
  <% } %>

  <tr>
    <td colspan="5">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td class="width-50" valign="top">
      <table border="0" cellpadding="3" cellspacing="0" width="100%">
        <% if (bankDetails.hasBankDetails) { %>
        <tr>
          <td class="bold">Bank Details</td>
        </tr>
        <% if (bankDetails.bankName) { %>
        <tr>
          <td>Bank: <%= bankDetails.bankName %></td>
        </tr>
        <% } %>
        <% if (bankDetails.accountHolder) { %>
        <tr>
          <td>A/c Name: <%= bankDetails.accountHolder %></td>
        </tr>
        <% } %>
        <% if (bankDetails.accountNumber) { %>
        <tr>
          <td>A/c No.: <%= bankDetails.accountNumber %></td>
        </tr>
        <% } %>
        <% if (bankDetails.ifscCode) { %>
        <tr>
          <td>IFSC: <%= bankDetails.ifscCode %></td>
        </tr>
        <% } %>
        <% if (bankDetails.branchName) { %>
        <tr>
          <td>Branch: <%= bankDetails.branchName %></td>
        </tr>
        <% } %>
        <% if (bankDetails.upiId) { %>
        <tr>
          <td>UPI: <%= bankDetails.upiId %></td>
        </tr>
        <% } %>
        <% } %>
      </table>
    </td>
    <td class="width-50" valign="top">
      <table border="0" cellpadding="3" cellspacing="0" width="100%">
        <tr>
          <td class="align-center for">For <%= company.name %></td>
        </tr>
        <tr>
          <td style="height: 50px;">&nbsp;</td>
        </tr>
        <tr>
          <td class="align-center">Authorised Signatory</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export const DEFAULT_CSS_STYLES = `body {
  font-family: Calibri, Arial, sans-serif;
  font-size: 14px;
  margin: 0;
  padding: 0;
  padding-right: 1px; /* Prevent right border clipping in PDF */
  line-height: 1.4;
}

p {
  padding: 0;
  margin: 0;
}

table {
  table-layout: auto;
  width: 100%;
  border-collapse: collapse;
}

td {
  width: auto;
  vertical-align: top;
}

.title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 8px;
}

.org_name {
  font-size: 20px;
  font-weight: bold;
}

.profession {
  font-weight: bold;
  font-style: italic;
  font-size: 15px;
}

.recipient_det {
  text-align: center;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.inv {
  font-size: 15px;
}

.width-50 {
  width: 50%;
}

.width-less {
  width: 7%;
}

.width-md {
  width: 18%;
}

.bold {
  font-weight: bold;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

.table-header {
  background: rgb(242, 242, 242);
}

.brdL {
  border-left: 1px solid rgb(89, 89, 89);
}

.brdR {
  border-right: 1px solid rgb(89, 89, 89);
}

.brdT {
  border-top: 1px solid rgb(89, 89, 89);
}

.brdB {
  border-bottom: 1px solid rgb(89, 89, 89);
}

.cname {
  font-size: 16px;
}

.for {
  font-size: 15px;
}

.padding-3 {
  padding: 4px;
}

.item-description {
  font-style: italic;
  color: #555;
  font-size: 12px;
}

.cancelled-banner {
  background-color: #dc2626;
  color: white;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  padding: 8px;
  margin-bottom: 10px;
  letter-spacing: 2px;
  border-radius: 4px;
}

.status-cancelled {
  color: #dc2626;
  font-weight: bold;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .cancelled-banner {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}`;

// Non GST Invoice Template - Clean invoice without GST-specific fields
export const NON_GST_HTML_TEMPLATE = `<% if (invoice.status === 'CANCELLED') { %>
<div class="cancelled-banner">CANCELLED</div>
<% } %>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td class="title">INVOICE</td>
  </tr>
  <tr>
    <td style="font-size: 12px;">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="3" cellspacing="0" width="100%">
  <tr>
    <td valign="top" class="width-50">
      <span class="org_name"><%= company.name %></span><br/>
      <% if (company.profession) { %>
      <span class="profession"><%= company.profession %></span><br/>
      <% } %>
      <% if (company.addressLine1) { %><%= company.addressLine1 %><br/><% } %>
      <% if (company.addressLine2) { %><%= company.addressLine2 %><br/><% } %>
      <%= company.city %><% if (company.pinCode) { %> - <%= company.pinCode %><% } %><br/>
      <%= company.state %><br/>
      <% if (company.phone) { %>Ph.: <%= company.phone %><br/><% } %>
      <% if (company.email) { %>Email: <%= company.email %><br/><% } %>
      <% if (company.pan) { %><b>PAN:</b> <%= company.pan %><% } %>
    </td>
    <td valign="top" class="width-50">
      <p class="recipient_det">BILLED TO</p>
      <span class="bold cname"><%= customer.name %></span><br/>
      <% if (customer.addressLine1) { %><%= customer.addressLine1 %><br/><% } %>
      <% if (customer.addressLine2) { %><%= customer.addressLine2 %><br/><% } %>
      <% if (customer.city) { %><%= customer.city %><% if (customer.pinCode) { %> - <%= customer.pinCode %><% } %><br/><% } %>
      <% if (customer.state) { %><%= customer.state %><br/><% } %>
      <% if (customer.phone) { %>Ph.: <%= customer.phone %><br/><% } %>
      <% if (customer.email) { %>Email: <%= customer.email %><br/><% } %>
      <% if (customer.pan) { %><b>PAN:</b> <%= customer.pan %><% } %>
    </td>
  </tr>

  <tr>
    <td colspan="2">&nbsp;</td>
  </tr>

  <tr>
    <td class="inv width-50"><b>Invoice No.:</b> <%= invoice.invoiceNumber %></td>
    <td class="inv width-50"><b>Invoice Date:</b> <%= invoice.invoiceDate %></td>
  </tr>

  <tr>
    <td colspan="2">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="4" cellspacing="0" width="100%">
  <tr class="table-header">
    <td class="align-center brdL brdT brdB width-less bold" width="10%">Sl No.</td>
    <td class="align-center padding-3 brdL brdT brdB bold" width="50%">Description</td>
    <td class="align-center padding-3 brdL brdT brdB bold" width="15%">Rate</td>
    <td class="align-center padding-3 brdL brdR brdT brdB bold" width="15%">Amount (<%= currencySymbol %>)</td>
  </tr>

  <% items.forEach(function(item) { %>
  <tr>
    <td class="align-center padding-3 brdL"><%= item.index %></td>
    <td class="padding-3 brdL">
      <%= item.name %>
      <% if (item.description) { %><br/><span class="item-description"><%= item.description %></span><% } %>
    </td>
    <td class="align-right padding-3 brdL"><%= item.rateFormatted %></td>
    <td class="align-right padding-3 brdL brdR"><%= item.amountFormatted %></td>
  </tr>
  <% }); %>

  <tr>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-center padding-3 brdL brdB">&nbsp;</td>
    <td class="align-right padding-3 brdL brdR brdB">&nbsp;</td>
  </tr>

  <tr>
    <td class="align-right padding-3 brdL brdB bold" colspan="3">Sub Total</td>
    <td class="align-right padding-3 brdL brdR brdB bold"><%= invoice.taxableTotalFormatted %></td>
  </tr>

  <% taxDiscountEntries.forEach(function(entry) { %>
  <tr>
    <td class="align-right padding-3 brdL brdB" colspan="3">
      <%= entry.name %><% if (entry.rateType === 'PERCENT') { %> @ <%= entry.rate %>%<% } %>
    </td>
    <td class="align-right padding-3 brdL brdR brdB">
      <% if (entry.entryType === 'DISCOUNT') { %>-<% } %><%= entry.amountFormatted %>
    </td>
  </tr>
  <% }); %>

  <tr>
    <td class="align-right padding-3 brdL brdB bold" colspan="3">Total</td>
    <td class="align-right padding-3 brdL brdR brdB bold"><%= invoice.grandTotalFormatted %></td>
  </tr>
</table>

<table border="0" cellpadding="4" cellspacing="0" width="100%">
  <tr>
    <td class="brdL brdB padding-3 bold align-center" width="20%">Amount (In Words)</td>
    <td class="brdL brdB padding-3 brdR" colspan="3"><%= invoice.grandTotalInWords %></td>
  </tr>

  <tr>
    <td colspan="3">&nbsp;</td>
    <td class="align-center" style="width:15%">
      <% if (invoice.status === 'PAID') { %>Paid<% } else if (invoice.status === 'PARTIALLY_PAID') { %>Partially Paid<% } else if (invoice.status === 'UNPAID') { %>Unpaid<% } else if (invoice.status === 'CANCELLED') { %><span class="status-cancelled">Cancelled</span><% } %>
    </td>
  </tr>

  <% if (invoice.notes) { %>
  <tr>
    <td colspan="4" class="padding-3">
      <b>Notes:</b> <%= invoice.notes %>
    </td>
  </tr>
  <% } %>

  <tr>
    <td colspan="4">&nbsp;</td>
  </tr>
</table>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td class="width-50" valign="top">
      <table border="0" cellpadding="3" cellspacing="0" width="100%">
        <% if (bankDetails.hasBankDetails) { %>
        <tr>
          <td class="bold">Bank Details</td>
        </tr>
        <% if (bankDetails.bankName) { %>
        <tr>
          <td>Bank: <%= bankDetails.bankName %></td>
        </tr>
        <% } %>
        <% if (bankDetails.accountHolder) { %>
        <tr>
          <td>A/c Name: <%= bankDetails.accountHolder %></td>
        </tr>
        <% } %>
        <% if (bankDetails.accountNumber) { %>
        <tr>
          <td>A/c No.: <%= bankDetails.accountNumber %></td>
        </tr>
        <% } %>
        <% if (bankDetails.ifscCode) { %>
        <tr>
          <td>IFSC: <%= bankDetails.ifscCode %></td>
        </tr>
        <% } %>
        <% if (bankDetails.branchName) { %>
        <tr>
          <td>Branch: <%= bankDetails.branchName %></td>
        </tr>
        <% } %>
        <% if (bankDetails.upiId) { %>
        <tr>
          <td>UPI: <%= bankDetails.upiId %></td>
        </tr>
        <% } %>
        <% } %>
      </table>
    </td>
    <td class="width-50" valign="top">
      <table border="0" cellpadding="3" cellspacing="0" width="100%">
        <tr>
          <td class="align-center for">For <%= company.name %></td>
        </tr>
        <tr>
          <td style="height: 50px;">&nbsp;</td>
        </tr>
        <tr>
          <td class="align-center">Authorised Signatory</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export const NON_GST_CSS_STYLES = `body {
  font-family: Calibri, Arial, sans-serif;
  font-size: 14px;
  margin: 0;
  padding: 0;
  padding-right: 1px; /* Prevent right border clipping in PDF */
  line-height: 1.4;
}

p {
  padding: 0;
  margin: 0;
}

table {
  table-layout: auto;
  width: 100%;
  border-collapse: collapse;
}

td {
  width: auto;
  vertical-align: top;
}

.title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding: 8px;
}

.org_name {
  font-size: 20px;
  font-weight: bold;
}

.profession {
  font-weight: bold;
  font-style: italic;
  font-size: 15px;
}

.recipient_det {
  text-align: center;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.inv {
  font-size: 15px;
}

.width-50 {
  width: 50%;
}

.width-less {
  width: 7%;
}

.width-md {
  width: 18%;
}

.bold {
  font-weight: bold;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

.table-header {
  background: rgb(242, 242, 242);
}

.brdL {
  border-left: 1px solid rgb(89, 89, 89);
}

.brdR {
  border-right: 1px solid rgb(89, 89, 89);
}

.brdT {
  border-top: 1px solid rgb(89, 89, 89);
}

.brdB {
  border-bottom: 1px solid rgb(89, 89, 89);
}

.cname {
  font-size: 16px;
}

.for {
  font-size: 15px;
}

.padding-3 {
  padding: 4px;
}

.item-description {
  font-style: italic;
  color: #555;
  font-size: 12px;
}

.cancelled-banner {
  background-color: #dc2626;
  color: white;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  padding: 8px;
  margin-bottom: 10px;
  letter-spacing: 2px;
  border-radius: 4px;
}

.status-cancelled {
  color: #dc2626;
  font-weight: bold;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .cancelled-banner {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}`;
