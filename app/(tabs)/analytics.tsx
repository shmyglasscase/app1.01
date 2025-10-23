import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, TrendingDown, Package } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem } from '@/types/database';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalProfit: 0,
    avgItemValue: 0,
    mostValuableItem: null as InventoryItem | null,
    topCategory: '',
    totalItems: 0,
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted', null);

    if (error || !items || items.length === 0) {
      return;
    }

    const totalValue = items.reduce((sum, item) => sum + (item.current_value || 0), 0);
    const totalInvested = items.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
    const totalProfit = totalValue - totalInvested;
    const avgItemValue = totalValue / items.length;

    const mostValuable = items.reduce((max, item) =>
      (item.current_value || 0) > (max.current_value || 0) ? item : max
    , items[0]);

    const categoryCounts: { [key: string]: number } = {};
    items.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    setStats({
      totalValue,
      totalInvested,
      totalProfit,
      avgItemValue,
      mostValuableItem: mostValuable,
      topCategory,
      totalItems: items.length,
    });
  };

  const profitMargin = stats.totalInvested > 0
    ? ((stats.totalProfit / stats.totalInvested) * 100).toFixed(1)
    : '0.0';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your collection's value</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Total Collection Value</Text>
          <Text style={styles.mainCardValue}>${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <View style={styles.profitRow}>
            {stats.totalProfit >= 0 ? (
              <TrendingUp size={16} color="#38a169" />
            ) : (
              <TrendingDown size={16} color="#e53e3e" />
            )}
            <Text style={[styles.profitText, stats.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative]}>
              ${Math.abs(stats.totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitMargin}%)
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#d4f4e2' }]}>
              <DollarSign size={20} color="#38a169" />
            </View>
            <Text style={styles.statValue}>${stats.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Total Invested</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
              <Package size={20} color="#0284c7" />
            </View>
            <Text style={styles.statValue}>${stats.avgItemValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={styles.statLabel}>Avg Item Value</Text>
          </View>
        </View>

        {stats.mostValuableItem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Valuable Item</Text>
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {stats.mostValuableItem.name}
                </Text>
                <Text style={styles.itemCategory}>{stats.mostValuableItem.category}</Text>
              </View>
              <Text style={styles.itemValue}>
                ${stats.mostValuableItem.current_value?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Total Items</Text>
            <Text style={styles.insightValue}>{stats.totalItems}</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Top Category</Text>
            <Text style={styles.insightValue}>{stats.topCategory}</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Profit Margin</Text>
            <Text style={[styles.insightValue, stats.totalProfit >= 0 ? styles.profitPositive : styles.profitNegative]}>
              {profitMargin}%
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  mainCard: {
    backgroundColor: '#38a169',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainCardLabel: {
    fontSize: 14,
    color: '#d4f4e2',
    marginBottom: 8,
  },
  mainCardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profitPositive: {
    color: '#d4f4e2',
  },
  profitNegative: {
    color: '#fed7d7',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#718096',
  },
  itemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38a169',
  },
  insightCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightLabel: {
    fontSize: 16,
    color: '#718096',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  bottomSpacing: {
    height: 40,
  },
});
