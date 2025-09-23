// Inside the ManageEventScreen component in app/events/[id]/manage.tsx

const settleBet = async (categoryId: string, correctAnswer: string) => {
  Alert.alert(
    'Settle Bets',
    `Are you sure you want to settle this category with the answer: "${correctAnswer}"?\n\nThis action cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        style: 'destructive',
        onPress: async () => {
          try {
            // THE FIX: Call the new database function with a single RPC call
            const { error } = await supabase.rpc('settle_bet', {
              category_id_to_settle: categoryId,
              correct_answer_option: correctAnswer,
            });

            if (error) throw error;

            await loadEventData();
            Alert.alert('Success', 'Bets have been settled successfully!');

          } catch (error: any) {
            console.error('Error settling bets:', error);
            Alert.alert('Error', error.message || 'Failed to settle bets');
          }
        }
      }
    ]
  );
};