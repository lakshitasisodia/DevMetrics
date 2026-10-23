// Convert a value to a afe number 

export function safeNumber(value,fallback =0){
    const number = Number(value);
    if(!Number.isFinite(number)) return fallback ;

    return number;
}

export function safeDivide(numerator , denominator){
    const safeNumerator = safeNumber(numerator);
    const safeDenominator = safeNumber(denominator);

    if(safeDenominator ==0) return 0;

    return safeNumerator/safeDenominator;
}

export function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}


//Round a number 

export function roundNumber(value,decimalPlaces =2){
    const number = safeNumber(value);

    const multiplier = 10** decimalPlaces;

    return Math.round(number * multiplier)/multiplier;
}


export function getCommitAuthorIdentity(commit) {
  if (!commit || typeof commit !== "object") {
    return null;
  }

  // Preferred: GitHub-associated account
  if (
    commit.author &&
    typeof commit.author === "object" &&
    typeof commit.author.login === "string" &&
    commit.author.login.trim() !== ""
  ) {
    return `github:${commit.author.login.trim().toLowerCase()}`;
  }

  // Fallback: commit author email
  if (
    commit.commit &&
    commit.commit.author &&
    typeof commit.commit.author.email === "string" &&
    commit.commit.author.email.trim() !== ""
  ) {
    return `email:${commit.commit.author.email.trim().toLowerCase()}`;
  }

  // Final fallback: commit author name
  if (
    commit.commit &&
    commit.commit.author &&
    typeof commit.commit.author.name === "string" &&
    commit.commit.author.name.trim() !== ""
  ) {
    return `name:${commit.commit.author.name.trim().toLowerCase()}`;
  }

  // No usable author information
  return null;
}

export function getCommitDate(commit) {
  if (!commit || typeof commit !== "object") {
    return null;
  }

  const authorDate =
    commit.commit &&
    commit.commit.author &&
    commit.commit.author.date;

  if (typeof authorDate === "string") {
    const timestamp = new Date(authorDate);

    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp;
    }
  }

  const committerDate =
    commit.commit &&
    commit.commit.committer &&
    commit.commit.committer.date;

  if (typeof committerDate === "string") {
    const timestamp = new Date(committerDate);

    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp;
    }
  }

  return null;
}


export function differenceInDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const differenceMilliseconds = Math.abs(
    end.getTime() - start.getTime()
  );

  return differenceMilliseconds / (1000 * 60 * 60 * 24);
}

export const isFiniteNumber = (value) => {
  return typeof value === "number" && Number.isFinite(value);
};

export const validateNonNegative = (value, fieldName) => {
  if (!isFiniteNumber(value) || value < 0) {
    throw new Error(
      `Invalid metric "${fieldName}": expected a non-negative finite number`
    );
  }

  return value;
};

export const validatePercentage = (value, fieldName) => {
  if (
    !isFiniteNumber(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `Invalid metric "${fieldName}": expected a percentage between 0 and 100`
    );
  }

  return value;
};