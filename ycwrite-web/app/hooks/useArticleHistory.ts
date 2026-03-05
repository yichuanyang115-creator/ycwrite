import { useState, useEffect } from 'react'
import { ThinkingFlow } from '@/types/thinking'

interface Article {
  id: string
  title: string
  topic: string
  audience: string
  length: 'short' | 'medium' | 'long'
  viewpoint?: string
  markdown: string
  html: string
  wordCount: number
  imageCount: number
  createdAt: number
  status: 'done'
  thinkingFlowId?: string
  researchData?: string
  outlineData?: string
}

const STORAGE_KEY = 'writemaster_articles'
const THINKING_STORAGE_KEY = 'writemaster_thinking'
const MAX_ARTICLES = 10

export function useArticleHistory() {
  const [articles, setArticles] = useState<Article[]>([])

  // 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setArticles(parsed)
      }
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
  }, [])

  // 保存文章
  const saveArticle = (article: Omit<Article, 'id' | 'createdAt' | 'status'>) => {
    const newArticle: Article = {
      ...article,
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: 'done'
    }

    setArticles(prev => {
      const updated = [newArticle, ...prev].slice(0, MAX_ARTICLES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })

    return newArticle.id
  }

  // 保存思考流数据
  const saveThinkingFlow = (thinkingFlow: ThinkingFlow) => {
    try {
      localStorage.setItem(`${THINKING_STORAGE_KEY}_${thinkingFlow.articleId}`, JSON.stringify(thinkingFlow))
    } catch (e) {
      console.error('Failed to save thinking flow:', e)
    }
  }

  // 获取思考流数据
  const getThinkingFlow = (articleId: string): ThinkingFlow | null => {
    try {
      const stored = localStorage.getItem(`${THINKING_STORAGE_KEY}_${articleId}`)
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      console.error('Failed to load thinking flow:', e)
      return null
    }
  }

  // 删除文章
  const deleteArticle = (id: string) => {
    setArticles(prev => {
      const updated = prev.filter(a => a.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      // 同时删除思考流数据
      localStorage.removeItem(`${THINKING_STORAGE_KEY}_${id}`)
      return updated
    })
  }

  // 获取单篇文章
  const getArticle = (id: string) => {
    return articles.find(a => a.id === id)
  }

  return {
    articles,
    saveArticle,
    deleteArticle,
    getArticle,
    saveThinkingFlow,
    getThinkingFlow
  }
}
