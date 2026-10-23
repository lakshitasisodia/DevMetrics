
import {
  ensureArray,
  roundNumber,
  safeDivide,
} from "./metricUtils.js";



function getReviewGroups(reviewData) {
  return ensureArray(reviewData);
}

export function calculateTotalReviews(reviewData) {
  const groups = getReviewGroups(reviewData);

  return groups.reduce((total, group) => {
    return total + ensureArray(group?.reviews).length;
  }, 0);
}


export function calculateReviewsPerPR(
  reviewData,
  totalPRs
) {
  const totalReviews =
    calculateTotalReviews(reviewData);

  return roundNumber(
    safeDivide(totalReviews, totalPRs)
  );
}


export function calculateTimeToFirstReview(group) {
  if (!group || typeof group !== "object") {
    return null;
  }

  if (!group.createdAt) {
    return null;
  }

  const created = new Date(group.createdAt);

  if (Number.isNaN(created.getTime())) {
    return null;
  }

  const reviews = ensureArray(group.reviews);

  const reviewDates = reviews
    .map((review) => {
      const dateValue =
        review?.submitted_at ||
        review?.submittedAt;

      if (!dateValue) {
        return null;
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    })
    .filter((date) => date !== null);

  if (reviewDates.length === 0) {
    return null;
  }

  const firstReview = reviewDates.reduce(
    (earliest, current) =>
      current < earliest ? current : earliest
  );

  const milliseconds =
    firstReview.getTime() - created.getTime();

  if (milliseconds < 0) {
    return null;
  }

  return milliseconds / (1000 * 60 * 60);
}


export function calculateAverageTimeToFirstReview(
  reviewData
) {
  const groups = getReviewGroups(reviewData);

  const times = groups
    .map(calculateTimeToFirstReview)
    .filter(
      (hours) =>
        hours !== null &&
        Number.isFinite(hours)
    );

  if (times.length === 0) {
    return 0;
  }

  const totalHours = times.reduce(
    (sum, hours) => sum + hours,
    0
  );

  return roundNumber(
    safeDivide(totalHours, times.length)
  );
}

export function calculateReviewMetrics(
  reviewData,
  totalPRs
) {
  return {
    totalReviews:
      calculateTotalReviews(reviewData),

    reviewsPerPR:
      calculateReviewsPerPR(
        reviewData,
        totalPRs
      ),

    averageTimeToFirstReview:
      calculateAverageTimeToFirstReview(
        reviewData
      ),
  };
}