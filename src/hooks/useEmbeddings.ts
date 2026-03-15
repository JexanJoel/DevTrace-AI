import { useState, useCallback } from 'react';
import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

export const useEmbeddings = () => {
  const [loading, setLoading] = useState(false);

  const getPipeline = async () => {
    if (!embeddingPipeline) {
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipeline;
  };

  const generateEmbedding = useCallback(async (text: string): Promise<number[] | null> => {
    if (!text || text.trim().length < 5) return null;
    
    setLoading(true);
    try {
      const pipe = await getPipeline();
      const output = await pipe(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      return Array.from(output.data);
    } catch (err) {
      console.error('Error generating embedding:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  return { generateEmbedding, calculateCosineSimilarity, loading };
};
