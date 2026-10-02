const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

// 1. Add state
const stateMarker = `const [showPayment, setShowPayment] = useState<boolean>(false);`;
if (code.includes(stateMarker) && !code.includes('paymentPercent')) {
    code = code.replace(stateMarker, `${stateMarker}\n  const [paymentPercent, setPaymentPercent] = useState<50 | 100>(100);`);
}

// 2. Add the segmented control inside the payment modal
const paymentHeaderRegex = /<h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Thanh toán đơn hàng<\/h3>\s*<p className="text-xs text-slate-500 mt-1 mb-4 text-center">Quét mã VietQR bằng ứng dụng ngân hàng<\/p>/;

const segmentedControl = `<h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Thanh toán đơn hàng</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 text-center">Quét mã VietQR bằng ứng dụng ngân hàng</p>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold w-full">
                <button 
                  onClick={() => setPaymentPercent(100)} 
                  className={\`flex-1 py-2 rounded-lg transition-all \${paymentPercent === 100 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Thanh toán 100%
                </button>
                <button 
                  onClick={() => setPaymentPercent(50)} 
                  className={\`flex-1 py-2 rounded-lg transition-all \${paymentPercent === 50 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Cọc 50%
                </button>
              </div>`;

code = code.replace(paymentHeaderRegex, segmentedControl);

// 3. Update the price displayed in the payment modal
// Find the precise block:
// <p className="text-slate-500">Số tiền thanh toán:</p>
// <p className="text-2xl font-black text-emerald-600">{formattedPrice}</p>
const priceDisplayRegex = /<p className="text-slate-500">Số tiền thanh toán:<\/p>\s*<p className="text-2xl font-black text-emerald-600">\{formattedPrice\}<\/p>/;
const newPriceDisplay = `<p className="text-slate-500">Số tiền thanh toán:</p>
                  <p className="text-2xl font-black text-emerald-600">{(paymentPercent === 100 ? totalPrice : totalPrice / 2).toLocaleString('vi-VN') + 'đ'}</p>`;
code = code.replace(priceDisplayRegex, newPriceDisplay);

// 4. Update the success modal
// <span className="text-slate-500">Tổng thanh toán:</span> <span className="font-black text-emerald-600">{formattedPrice}</span>
const successPriceRegex = /<span className="text-slate-500">Tổng thanh toán:<\/span>\s*<span className="font-black text-emerald-600">\{formattedPrice\}<\/span>/;
const newSuccessPrice = `<span className="text-slate-500">Đã thanh toán {paymentPercent === 50 ? '(Cọc 50%)' : ''}:</span> <span className="font-black text-emerald-600">{(paymentPercent === 100 ? totalPrice : totalPrice / 2).toLocaleString('vi-VN')}đ</span>`;
code = code.replace(successPriceRegex, newSuccessPrice);

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
console.log("Updated Payment UI!");
