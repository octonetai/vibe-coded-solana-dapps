import React, { useState, useEffect, useCallback } from 'react';
import ConfessionCard from './ConfessionCard';
import { CONFESSION_CATEGORIES } from '../constants';

const ConfessionFeed = ({ client, showNotification }) => {
  const [confessions, setConfessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const PAGE_SIZE = 10;

  const fetchConfessions = useCallback(async (pageNum) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getConfessions(pageNum * PAGE_SIZE, PAGE_SIZE);
      if (result.success) {
        setConfessions(prev => pageNum === 0 ? result.confessions : [...prev, ...result.confessions]);
        setHasMore(result.hasMore);
      } else {
        throw new Error(result.error || 'Failed to fetch confessions.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [client, showNotification]);
  
  useEffect(() => {
    fetchConfessions(0);
  }, [fetchConfessions]);

  const handleInteractionSuccess = (confessionId, actionType, updatedData) => {
    setConfessions(prevConfessions => 
      prevConfessions.map(c => {
        if (c.id === confessionId) {
          return { ...c, ...updatedData };
        }
        return c;
      })
    );
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchConfessions(nextPage);
  }

  return (
    <div className="card">
      <div className="feed-header">
        <h2 className="feed-title">The Confessional</h2>
      </div>
      <div className="confession-feed">
        {isLoading && confessions.length === 0 && <div className="loading-indicator">Loading secrets...</div>}
        {error && <div className="loading-indicator error">Error: {error}</div>}
        {!isLoading && confessions.length === 0 && !error && (
          <div className="empty-state">
            The confessional is empty. Be the first to share a secret.
          </div>
        )}
        {confessions.map(confession => (
          <ConfessionCard
            key={confession.id}
            confession={confession}
            client={client}
            showNotification={showNotification}
            onInteractionSuccess={handleInteractionSuccess}
          />
        ))}
        {isLoading && confessions.length > 0 && <div className="loading-indicator">Loading more...</div>}
        {hasMore && !isLoading && (
            <button onClick={loadMore} className="form-button centered" style={{marginTop: '1rem', width: 'auto'}}>Load More</button>
        )}
      </div>
    </div>
  );
};

export default ConfessionFeed;
