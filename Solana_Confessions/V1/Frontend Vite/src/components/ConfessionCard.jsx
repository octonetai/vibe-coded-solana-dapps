import React, { useState } from 'react';
import { Heart, Flag } from 'lucide-react';
import { CONFESSION_CATEGORIES } from '../constants';

const timeSince = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const ConfessionCard = ({ confession, client, showNotification, onInteractionSuccess }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const result = await client.likeConfession(confession.id);
      if (result.success) {
        showNotification('Confession liked!', 'success');
        onInteractionSuccess(confession.id, 'like', {
          likes: (parseInt(confession.likes) + 1).toString()
        });
      } else {
        throw new Error(result.error || 'Failed to like confession.');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleReport = async () => {
    const reason = prompt("Please provide a reason for reporting this confession (5-100 characters):");
    if (!reason || reason.length < 5 || reason.length > 100) {
      if (reason !== null) { // User didn't click cancel
          showNotification('Invalid reason. Must be 5-100 characters.', 'error');
      }
      return;
    }
    setIsReporting(true);
    try {
      const result = await client.reportConfession(confession.id, reason);
      if (result.success) {
        showNotification('Confession reported.', 'success');
        onInteractionSuccess(confession.id, 'report', {
          reports: (parseInt(confession.reports) + 1).toString()
        });
      } else {
        throw new Error(result.error || 'Failed to report confession.');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="confession-card">
      <p className="confession-content">{confession.content}</p>
      <div className="confession-footer">
        <div className="confession-meta">
          <span>{timeSince(confession.timestamp)}</span>
          <span className="category-badge">
            {CONFESSION_CATEGORIES[confession.category] || 'General'}
          </span>
        </div>
        <div className="confession-actions">
          <button className="action-button" onClick={handleLike} disabled={isLiking}>
            <Heart size={18} />
            <span>{confession.likes}</span>
          </button>
          <button className="action-button" onClick={handleReport} disabled={isReporting}>
            <Flag size={18} />
             <span>{confession.reports}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfessionCard;
