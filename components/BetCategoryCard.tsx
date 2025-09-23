import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Trophy, Clock } from 'lucide-react-native';

interface BetCategoryCardProps {
  title: string;
  description?: string;
  options: string[];
  points: number;
  status: 'open' | 'closed' | 'settled';
  userBet?: string;
  isCorrect?: boolean | null;
  pointsEarned?: number;
  onPress: () => void;
  disabled?: boolean;
}

export default function BetCategoryCard({
  title,
  description,
  options,
  points,
  status,
  userBet,
  isCorrect,
  pointsEarned,
  onPress,
  disabled = false,
}: BetCategoryCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'open':
        return '#10B981';
      case 'closed':
        return '#F59E0B';
      case 'settled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'open':
        return <Target size={16} color="#10B981" />;
      case 'closed':
        return <Clock size={16} color="#F59E0B" />;
      case 'settled':
        return <Trophy size={16} color="#6B7280" />;
      default:
        return null;
    }
  };

  const getBetResult = () => {
    if (status === 'settled' && userBet) {
      if (isCorrect === true) {
        return `✅ Correct! +${pointsEarned || 0} pts`;
      } else if (isCorrect === false) {
        return '❌ Incorrect';
      }
    }
    if (userBet) {
      return `Your bet: ${userBet}`;
    }
    return 'No bet placed';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabled,
        userBet && styles.withBet,
        isCorrect === true && styles.correct,
        isCorrect === false && styles.incorrect,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.meta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            {getStatusIcon()}
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.points}>{points} pts</Text>
        </View>
      </View>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      <Text style={styles.optionsCount}>
        {options.length} option{options.length !== 1 ? 's' : ''} available
      </Text>
      
      <View style={styles.footer}>
        <Text style={[
          styles.betResult,
          isCorrect === true && styles.correctText,
          isCorrect === false && styles.incorrectText,
        ]}>
          {getBetResult()}
        </Text>
        
        {status === 'open' && (
          <View style={styles.action}>
            <Target size={14} color="#D4AF37" />
            <Text style={styles.actionText}>
              {userBet ? 'Change Bet' : 'Place Bet'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.7,
  },
  withBet: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  correct: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  incorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  optionsCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betResult: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  correctText: {
    color: '#10B981',
    fontWeight: '600',
  },
  incorrectText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
});