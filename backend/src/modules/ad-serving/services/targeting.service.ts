import { prisma } from '../../../shared/database/prisma';

export class TargetingService {
  /**
   * Evaluate targeting criteria for an ad against user context
   */
  async evaluateTargeting(
    adId: string,
    userContext: {
      geoLocation?: any;
      deviceInfo?: any;
      interests?: string[];
      demographics?: any;
      behaviors?: any[];
    }
  ): Promise<{
    matches: boolean;
    score: number;
    breakdown: Record<string, any>;
    reasons: string[];
  }> {
    try {
      // Get ad targeting criteria
      const ad = await prisma.advertiserAd.findUnique({
        where: { id: adId }
      });

      if (!ad) {
        throw new Error('Ad not found');
      }

      const adTargeting = (ad.targeting || {}) as any;
      const campaignTargeting = {} as any;
      
      // Combine ad and campaign targeting
      const combinedTargeting = { ...(campaignTargeting as any), ...(adTargeting as any) };

      // Evaluate each targeting dimension
      const results = {
        geographic: this.evaluateGeographicTargeting(combinedTargeting.geoLocation, userContext.geoLocation),
        device: this.evaluateDeviceTargeting(combinedTargeting.deviceInfo, userContext.deviceInfo),
        interests: this.evaluateInterestTargeting(combinedTargeting.interests ?? [], userContext.interests ?? []),
        demographics: this.evaluateDemographicTargeting(combinedTargeting.demographics, userContext.demographics),
        behaviors: this.evaluateBehavioralTargeting(combinedTargeting.behaviors ?? [], userContext.behaviors ?? [])
      } as Record<string, any>;

      // Calculate overall score
      const scores = Object.values(results).map(r => r.score);
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Determine if targeting matches
      const matches = overallScore >= 0.5; // Threshold for matching

      // Generate reasons for match/no match
      const reasons = this.generateTargetingReasons(results, overallScore);

      return {
        matches,
        score: overallScore,
        breakdown: results,
        reasons
      };
    } catch (error) {
      throw new Error(`Targeting evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluate geographic targeting
   */
  private evaluateGeographicTargeting(adGeo: any, userGeo: any): { matches: boolean; score: number; details: any } {
    if (!adGeo || !userGeo) {
      return { matches: true, score: 0.5, details: { reason: 'No geographic targeting specified' } };
    }

    let score = 0;
    let checks = 0;

    // Country matching
    if (adGeo.country && userGeo.country) {
      checks++;
      if (adGeo.country === userGeo.country) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Region matching
    if (adGeo.region && userGeo.region) {
      checks++;
      if (adGeo.region === userGeo.region) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // City matching
    if (adGeo.city && userGeo.city) {
      checks++;
      if (adGeo.city === userGeo.city) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Distance-based targeting (if coordinates provided)
    if (adGeo.latitude && adGeo.longitude && userGeo.latitude && userGeo.longitude) {
      checks++;
      const distance = this.calculateDistance(
        adGeo.latitude, adGeo.longitude,
        userGeo.latitude, userGeo.longitude
      );
      
      if (distance <= 50) score += 1; // Within 50km
      else if (distance <= 100) score += 0.8; // Within 100km
      else if (distance <= 200) score += 0.6; // Within 200km
      else score += 0.2; // Beyond 200km
    }

    const finalScore = checks > 0 ? score / checks : 0.5;
    const matches = finalScore >= 0.7;

    return {
      matches,
      score: finalScore,
      details: {
        adGeo,
        userGeo,
        checks,
        distance: adGeo.latitude && userGeo.latitude ? 
          this.calculateDistance(adGeo.latitude, adGeo.longitude, userGeo.latitude, userGeo.longitude) : null
      }
    };
  }

  /**
   * Evaluate device targeting
   */
  private evaluateDeviceTargeting(adDevice: any, userDevice: any): { matches: boolean; score: number; details: any } {
    if (!adDevice || !userDevice) {
      return { matches: true, score: 0.5, details: { reason: 'No device targeting specified' } };
    }

    let score = 0;
    let checks = 0;

    // Device type matching
    if (adDevice.type && userDevice.type) {
      checks++;
      if (adDevice.type === userDevice.type) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Browser matching
    if (adDevice.browser && userDevice.browser) {
      checks++;
      if (adDevice.browser === userDevice.browser) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // OS matching
    if (adDevice.os && userDevice.os) {
      checks++;
      if (adDevice.os === userDevice.os) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Screen size matching
    if (adDevice.screenSize && userDevice.screenSize) {
      checks++;
      if (this.matchesScreenSize(adDevice.screenSize, userDevice.screenSize)) {
        score += 1;
      } else {
        score += 0;
      }
    }

    const finalScore = checks > 0 ? score / checks : 0.5;
    const matches = finalScore >= 0.7;

    return {
      matches,
      score: finalScore,
      details: {
        adDevice,
        userDevice,
        checks
      }
    };
  }

  /**
   * Evaluate interest targeting
   */
  private evaluateInterestTargeting(adInterests: string[], userInterests: string[]): { matches: boolean; score: number; details: any } {
    if (!adInterests || !userInterests || adInterests.length === 0 || userInterests.length === 0) {
      return { matches: true, score: 0.5, details: { reason: 'No interest targeting specified' } };
    }

    const intersection = adInterests.filter(interest => userInterests.includes(interest));
    const union = [...new Set([...adInterests, ...userInterests])];
    
    const score = intersection.length / union.length;
    const matches = score >= 0.3; // At least 30% overlap

    return {
      matches,
      score,
      details: {
        adInterests,
        userInterests,
        intersection,
        overlap: score
      }
    };
  }

  /**
   * Evaluate demographic targeting
   */
  private evaluateDemographicTargeting(adDemographics: any, userDemographics: any): { matches: boolean; score: number; details: any } {
    if (!adDemographics || !userDemographics) {
      return { matches: true, score: 0.5, details: { reason: 'No demographic targeting specified' } };
    }

    let score = 0;
    let checks = 0;

    // Age range matching
    if (adDemographics.ageRange && userDemographics.ageRange) {
      checks++;
      if (this.matchesAgeRange(adDemographics.ageRange, userDemographics.ageRange)) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Gender matching
    if (adDemographics.gender && userDemographics.gender) {
      checks++;
      if (adDemographics.gender === userDemographics.gender) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Income matching
    if (adDemographics.income && userDemographics.income) {
      checks++;
      if (this.matchesIncomeRange(adDemographics.income, userDemographics.income)) {
        score += 1;
      } else {
        score += 0;
      }
    }

    // Education matching
    if (adDemographics.education && userDemographics.education) {
      checks++;
      if (adDemographics.education === userDemographics.education) {
        score += 1;
      } else {
        score += 0;
      }
    }

    const finalScore = checks > 0 ? score / checks : 0.5;
    const matches = finalScore >= 0.7;

    return {
      matches,
      score: finalScore,
      details: {
        adDemographics,
        userDemographics,
        checks
      }
    };
  }

  /**
   * Evaluate behavioral targeting
   */
  private evaluateBehavioralTargeting(adBehaviors: any[], userBehaviors: any[]): { matches: boolean; score: number; details: any } {
    if (!adBehaviors || !userBehaviors || adBehaviors.length === 0 || userBehaviors.length === 0) {
      return { matches: true, score: 0.5, details: { reason: 'No behavioral targeting specified' } };
    }

    let score = 0;
    let checks = 0;

    for (const adBehavior of adBehaviors) {
      const matchingUserBehavior = userBehaviors.find(ub => 
        ub.type === adBehavior.type && ub.value === adBehavior.value
      );

      if (matchingUserBehavior) {
        checks++;
        // Score based on frequency match
        const frequencyScore = this.calculateFrequencyScore(adBehavior.frequency, matchingUserBehavior.frequency);
        score += frequencyScore;
      }
    }

    const finalScore = checks > 0 ? score / checks : 0.5;
    const matches = finalScore >= 0.6;

    return {
      matches,
      score: finalScore,
      details: {
        adBehaviors,
        userBehaviors,
        checks,
        matchedBehaviors: adBehaviors.filter(ab => 
          userBehaviors.some(ub => ub.type === ab.type && ub.value === ab.value)
        )
      }
    };
  }

  /**
   * Generate targeting reasons
   */
  private generateTargetingReasons(results: any, overallScore: number): string[] {
    const reasons: string[] = [];

    if (overallScore >= 0.8) {
      reasons.push('Excellent targeting match across all dimensions');
    } else if (overallScore >= 0.6) {
      reasons.push('Good targeting match with some areas for improvement');
    } else if (overallScore >= 0.4) {
      reasons.push('Moderate targeting match, consider refining criteria');
    } else {
      reasons.push('Poor targeting match, significant refinement needed');
    }

    // Add specific dimension feedback
    Object.entries(results as Record<string, any>).forEach(([dimension, result]) => {
      if ((result as any).score < 0.5) {
        reasons.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} targeting needs improvement`);
      }
    });

    return reasons;
  }

  // Helper methods
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private matchesScreenSize(adSize: string, userSize: string): boolean {
    // Simplified screen size matching
    const adDimensions = adSize.split('x').map(Number);
    const userDimensions = userSize.split('x').map(Number);
    
    if (adDimensions.length !== 2 || userDimensions.length !== 2) return false;
    
    const adWidth = adDimensions[0];
    const adHeight = adDimensions[1];
    const userWidth = userDimensions[0];
    const userHeight = userDimensions[1];
    
    // Check if ad can fit within user's screen
    return adWidth <= userWidth && adHeight <= userHeight;
  }

  private matchesAgeRange(adRange: string, userAge: number): boolean {
    // Parse age range (e.g., "18-25", "25+")
    if (adRange.includes('-')) {
      const [min, max] = adRange.split('-').map(Number);
      return userAge >= min && userAge <= max;
    } else if (adRange.includes('+')) {
      const min = parseInt(adRange.replace('+', ''));
      return userAge >= min;
    }
    return false;
  }

  private matchesIncomeRange(adRange: string, userIncome: string): boolean {
    // Simplified income matching
    return adRange === userIncome;
  }

  private calculateFrequencyScore(adFreq: number, userFreq: number): number {
    if (!adFreq || !userFreq) return 0.5;
    
    const ratio = Math.min(adFreq, userFreq) / Math.max(adFreq, userFreq);
    return ratio;
  }
} 