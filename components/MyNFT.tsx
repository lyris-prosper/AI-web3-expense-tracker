'use client'

import { useState } from 'react'

interface MyNFTProps {
  isOpen: boolean
  onClose: () => void
  nftImage?: string // NFT图片URL，你待会上传后我们再更新
  userName?: string
}

export default function MyNFT({ isOpen, onClose, nftImage, userName }: MyNFTProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-y-auto"
        onClick={onClose}
      >
        {/* 居中容器 */}
        <div className="min-h-full flex items-center justify-center p-4">
          {/* 弹窗内容 */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-4 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
          {/* 关闭按钮 */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* NFT图片展示区 */}
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-3 sm:p-6">
            <div className="bg-white rounded-xl p-2 sm:p-3 shadow-lg">
              {nftImage ? (
                <img
                  src={nftImage}
                  alt="首次记账NFT"
                  className="w-full h-auto rounded-lg max-h-[200px] sm:max-h-[250px] object-contain"
                />
              ) : (
                // 占位符 - 你上传图片后会替换
                <div className="w-full aspect-square bg-gradient-to-br from-yellow-200 to-pink-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🎉</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">首次记账</div>
                    <div className="text-base sm:text-lg text-gray-600 mt-1 sm:mt-2">纪念NFT</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 恭喜文字区 */}
          <div className="p-4 sm:p-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              🎉 太棒啦！恭喜你！
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              完成了人生第一笔记账！
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              你已成功解锁专属的<span className="font-bold text-purple-600">「首次记账NFT」</span>
            </p>

            {/* NFT信息卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">🏷️ NFT名称：</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800">首次记账NFT</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">✨ 稀有度：</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-600">传奇级</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">⛓️ 链上状态：</span>
                <span className="text-xs sm:text-sm font-semibold text-green-600">已永久铸造</span>
              </div>
            </div>

            {/* 激励文字 */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                🌟 这是你财富自由之旅的<span className="text-orange-600 font-bold">第一步</span>！<br />
                <span className="text-purple-600">每一笔记账都是对未来的投资</span>，<br />
                坚持下去，更多惊喜成就等你解锁！💪
              </p>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎊 好的，开启财富之旅！
            </button>

            {/* 提示文字 */}
            <p className="text-xs text-gray-500 mt-2 sm:mt-3">
              💼 你可以在钱包中随时查看这个专属NFT
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
