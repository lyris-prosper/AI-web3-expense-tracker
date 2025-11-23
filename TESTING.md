# Testing Guide

## Prerequisites

Before testing, ensure you have:

1. ✅ Node.js installed (v18 or higher)
2. ✅ A crypto wallet (MetaMask recommended)
3. ✅ Sepolia testnet ETH (from faucet)
4. ✅ API keys for AI services

## Setup Steps

### 1. Install Dependencies

```bash
cd /Users/caiw/Downloads/Project
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:

```env
# At least one AI service required
QWEN_API_KEY=your_qwen_key
CLAUDE_API_KEY=your_claude_key

# Required for IPFS storage
PINATA_JWT=your_pinata_jwt_token

# Required for wallet connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

#### Verify API Keys

**Test Qwen API**:
```bash
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer YOUR_QWEN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-turbo","input":{"messages":[{"role":"user","content":"你好"}]}}'
```

**Test Claude API**:
```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_CLAUDE_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```


### 3. Start Development Server

```bash
npm run dev
```

Navigate to: http://localhost:3000

## Testing Checklist

### Test 1: Basic UI Load
- [ ] Page loads without errors
- [ ] See "AI Web3 记账" header
- [ ] See "Connect Wallet" button
- [ ] See empty expense form

### Test 2: AI Parsing (No Wallet)
- [ ] Enter: "今天吃饭30块"
- [ ] Click "提交"
- [ ] See "AI解析中..." loading state
- [ ] See parsed result:
  - Amount: ¥30
  - Category: 餐饮
  - Date: Today's date
  - Description: 吃饭
- [ ] Click "确认添加"
- [ ] Expense appears in list below

### Test 3: Different Input Formats
Try these inputs:

```
"昨天打车12元"
"买衣服500"
"看电影花了80"
"地铁2.5元"
"午餐花费45"
```

Each should parse correctly with appropriate category.

### Test 4: AI Fallback
- [ ] Test with only QWEN_API_KEY set
- [ ] Test with only CLAUDE_API_KEY set
- [ ] Both should work (automatic fallback)

### Test 5: Wallet Connection
- [ ] Click "Connect Wallet"
- [ ] Select wallet (MetaMask)
- [ ] Approve connection
- [ ] See address in header
- [ ] See signature request for "ExpenseTracker"
- [ ] Approve signature

### Test 6: IPFS Upload (With Wallet)
- [ ] Connect wallet (see Test 5)
- [ ] Add expense: "测试IPFS 100块"
- [ ] Wait for upload (may take 3-5 seconds)
- [ ] Check browser console for "Uploaded to IPFS: Qm..."
- [ ] Expense should have CID property

### Test 7: Monthly Statistics
- [ ] Add multiple expenses
- [ ] Check "本月统计" section
- [ ] Verify total amount is correct
- [ ] Verify category breakdown shows correctly
- [ ] Different categories should show separately

### Test 8: Data Persistence
- [ ] Add several expenses
- [ ] Refresh page (F5)
- [ ] All expenses should still be visible
- [ ] Check localStorage in DevTools:
  - Key: "expenses"
  - Value: JSON array of expenses

### Test 9: Error Handling
- [ ] Enter gibberish: "asdfghjkl"
- [ ] Should show error message
- [ ] Enter empty string
- [ ] Submit button should be disabled
- [ ] Disconnect wallet mid-add
- [ ] Should still save to localStorage

### Test 10: Edge Cases
- [ ] Very large amount: "吃饭 999999 元"
- [ ] Decimal amount: "咖啡 3.5 块"
- [ ] No amount: "吃饭" (should fail gracefully)
- [ ] Multiple amounts: "吃饭30打车12" (AI should parse)

## Common Issues & Solutions

### Issue: "AI service not configured"
**Solution**: Check that either QWEN_API_KEY or CLAUDE_API_KEY is set in `.env.local`

### Issue: "IPFS upload failed"
**Solution**: 
- Check PINATA_JWT is valid and not expired
- Verify you have sufficient Pinata free tier limits
- Check internet connection
- Look at browser console for detailed error messages
- Try again (may be temporary network issue)

### Issue: Wallet won't connect
**Solution**:
- Ensure MetaMask is installed
- Switch to Sepolia testnet in wallet
- Clear browser cache and try again
- Check NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

### Issue: TypeScript errors
**Solution**:
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

### Issue: Module not found errors
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Manual Testing Scenarios

### Scenario 1: First-time User
1. Open app (no wallet)
2. Try AI parsing
3. Add 3-4 expenses
4. Check stats
5. Refresh and verify persistence

### Scenario 2: Web3 User
1. Connect wallet
2. Sign message
3. Add expense with IPFS
4. Verify CID in console
5. Check localStorage for CID

### Scenario 3: Multi-category
1. Add expenses in each category:
   - 餐饮: "午餐50"
   - 交通: "打车20"
   - 购物: "买书100"
   - 娱乐: "电影80"
   - 其他: "杂费30"
2. Verify stats show all categories

## Browser DevTools Testing

### Check LocalStorage
```javascript
// Open Console
localStorage.getItem('expenses')
localStorage.getItem('cidList')

// Clear data
localStorage.clear()
```

### Check Network Requests
1. Open Network tab
2. Filter: Fetch/XHR
3. Add expense
4. Should see:
   - POST to `/api/parse`
   - POST to `/api/ipfs-upload` (if wallet connected)

### Check Console Logs
Look for:
- "Uploaded to IPFS: Qm..."
- "AI parsing failed: ..." (if errors)
- "Failed to upload to IPFS: ..." (if errors)

## Performance Testing

### Expected Response Times
- AI Parsing: 1-3 seconds
- IPFS Upload: 3-5 seconds
- LocalStorage: Instant
- Page Load: < 2 seconds

## Debugging Tips

### Enable Verbose Logging

Add to components:

```typescript
console.log('State:', { expenses, isConnected, encryptionKey })
```

### Test API Routes Directly

```bash
# Test parse API
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"今天吃饭30块","prompt":"..."}'

# Test IPFS upload
curl -X POST http://localhost:3000/api/ipfs-upload \
  -H "Content-Type: application/json" \
  -d '{"data":"test data"}'
```

### Check Environment Variables

```bash
# In terminal
echo $QWEN_API_KEY
echo $CLAUDE_API_KEY
```

## Next Steps After Testing

If all tests pass:
1. ✅ Phase 1 complete
2. 🚀 Deploy to Vercel (optional)
3. 📝 Document any issues found
4. 🎯 Move to Phase 2 (NFT integration)

## Test Coverage Goals

- [ ] All core features working
- [ ] Error handling tested
- [ ] Edge cases handled
- [ ] Data persistence verified
- [ ] IPFS integration tested
- [ ] UI/UX smooth
- [ ] No console errors

---

**Test Status**: Ready for testing
**Last Updated**: 2025-11-22
