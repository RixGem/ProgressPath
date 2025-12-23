# French Learning Tracker - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Database Setup (One-time)

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add new fields to existing table
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS new_vocabulary TEXT[],
ADD COLUMN IF NOT EXISTS practice_sentences TEXT[],
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('good', 'neutral', 'difficult'));

ALTER TABLE french_learning 
ALTER COLUMN mood SET DEFAULT 'neutral';
```

Click **RUN** and you're done! ✅

### Step 2: Log Your First Activity

1. Go to the French Learning page
2. Click **"Log Activity"**
3. Fill in the form:
   - **Activity Type**: What you did (vocabulary, grammar, etc.)
   - **Duration**: How many minutes
   - **Date**: When you studied
   - **Mood**: How it went (😊 😐 😓)
   - **Vocabulary**: Words you learned (comma-separated)
   - **Sentences**: Sentences you practiced (comma-separated)
   - **Notes**: Any other details

4. Click **"Log Activity"** to save

### Step 3: Track Your Progress

Your dashboard now shows:
- 📊 **Total Hours** - All your study time
- 🔥 **Current Streak** - Consecutive days
- 📅 **Total Sessions** - All activities logged
- 📚 **Vocabulary Words** - Total words learned

---

## 📝 Example: Logging a Vocabulary Session

### Form Input:
```
Activity Type: Vocabulary
Duration: 30 minutes
Date: Today
Mood: 😊 Good - Felt confident
Vocabulary: bonjour, merci, s'il vous plaît, au revoir, bonne journée
Sentences: Bonjour! Comment allez-vous?, Merci beaucoup pour votre aide
Notes: Practiced greetings and polite phrases. Felt good about pronunciation.
```

### Result:
Your activity will show:
- ⏱️ 30 min
- 😊 Good mood
- 📚 5 vocabulary words in green badges
- 💬 2 practice sentences in a list
- 📝 Your notes

---

## 🎯 Quick Tips

### Vocabulary Input
```
✅ Good: bonjour, merci, au revoir
❌ Bad: bonjour merci au revoir (no commas)
```

### Practice Sentences
```
✅ Good: Je suis content, Comment ça va?, Bonne journée
❌ Bad: Je suis content Comment ça va (no commas)
```

### Building Streaks
- Log at least one activity per day
- Missing a day resets to 0
- Keep going to see your flame icon grow! 🔥

### Choosing Mood
- **😊 Good**: You understood everything easily
- **😐 Neutral**: Average progress, some challenges
- **😓 Difficult**: Struggled but kept going

---

## 📊 Understanding Your Stats

### Total Hours
- Automatically calculated from all sessions
- Shows as decimal (e.g., 12.5h = 12 hours 30 minutes)
- Updates instantly when you log activities

### Current Streak
- Counts consecutive days with activities
- Shows in the stats card with flame icon
- Displays encouragement message when active
- Resets if you miss a day

### Vocabulary Words
- Total count across ALL sessions
- Each word counted once per session
- Shows in the stats card
- Individual words shown as badges on each activity

### 7-Day Calendar
- Purple squares = Days with activities
- Gray squares = No activities
- Shows exact minutes on each tile
- Hover for more details

---

## 💡 Pro Tips

### 1. Daily Habit
Set a specific time each day to:
- Study French
- Log your activity immediately
- Keep your streak alive!

### 2. Vocabulary Lists
When entering vocabulary:
- Write exactly as learned
- Include accents: café, frère, été
- Separate with commas
- Can add 1-20 words per session

### 3. Practice Sentences
- Use full sentences
- Include punctuation
- Separate each sentence with a comma
- Great for reviewing later!

### 4. Mood Tracking
Use mood to:
- Identify difficult topics (😓)
- Celebrate easy wins (😊)
- Track your confidence over time
- Adjust study methods

### 5. Notes Section
Great for noting:
- Resources used (app, book, video)
- Topics covered
- Questions you have
- Things to review

---

## 🎓 Study Session Examples

### Example 1: Duolingo Practice
```
Activity: Vocabulary
Duration: 20 minutes
Mood: 😊 Good
Vocabulary: famille, mère, père, enfant, frère, sœur
Sentences: Ma famille est grande, J'ai deux frères
Notes: Completed Family unit on Duolingo. Aced the quiz!
```

### Example 2: YouTube Lesson
```
Activity: Listening
Duration: 45 minutes
Mood: 😐 Neutral
Vocabulary: comprendre, écouter, parler, difficile
Sentences: Je ne comprends pas, Pouvez-vous répéter?
Notes: Watched French pod video. Some parts were fast.
```

### Example 3: Textbook Study
```
Activity: Grammar
Duration: 60 minutes
Mood: 😓 Difficult
Vocabulary: imparfait, passé composé, conjugaison
Sentences: J'étais fatigué, J'ai mangé
Notes: Studied past tenses. Need more practice with imparfait.
```

### Example 4: Speaking Practice
```
Activity: Speaking
Duration: 30 minutes
Mood: 😊 Good
Vocabulary: conversation, rencontre, présentation
Sentences: Je m'appelle Chris, Enchanté de vous rencontrer
Notes: Practice session with language partner. Great conversation!
```

---

## 🔍 Reviewing Your Progress

### Check Recent Activities
Scroll down to see all your recent sessions with:
- Date and duration
- Mood indicator
- Vocabulary badges
- Practice sentences
- Your notes

### Track Vocabulary Growth
- Check the **Vocabulary Words** stat
- Review vocabulary badges on each activity
- See which words you're learning

### Monitor Consistency
- Watch your **Current Streak**
- View the **7-Day Calendar**
- Aim for daily practice

### Measure Time Investment
- Check **Total Hours**
- See daily minutes in 7-day view
- Track **Total Sessions**

---

## ❓ Common Questions

### Q: Do I have to fill in vocabulary every time?
**A**: No! Vocabulary and sentences are optional. Just fill in when relevant.

### Q: What if I forget to log an activity?
**A**: You can change the date field to log past activities.

### Q: Can I edit an activity after saving?
**A**: Not yet - but you can add a new entry with corrections and notes.

### Q: How is the streak calculated?
**A**: Consecutive days with at least one activity. Missing a day resets to 0.

### Q: What counts as a vocabulary word?
**A**: Any word or phrase you enter in the vocabulary field.

### Q: Can I see vocabulary from all sessions?
**A**: Yes! Scroll through your activities - each shows its vocabulary badges.

---

## 🎯 30-Day Challenge

### Week 1: Build the Habit
- [ ] Log an activity every day
- [ ] Try all activity types
- [ ] Track at least 10 vocabulary words

### Week 2: Add Detail
- [ ] Include vocabulary in every session
- [ ] Add at least 2 practice sentences per day
- [ ] Use all three mood indicators

### Week 3: Stay Consistent
- [ ] Maintain your streak
- [ ] Study for at least 20 minutes daily
- [ ] Review past vocabulary

### Week 4: Reflect and Grow
- [ ] Review your total hours
- [ ] Check your vocabulary count
- [ ] Note which moods are most common
- [ ] Plan next month's goals

---

## 🚨 Troubleshooting

### Problem: Stats Not Updating
**Solution**: Refresh the page (F5 or Cmd+R)

### Problem: Vocabulary Not Showing as Badges
**Solution**: 
1. Check you used commas to separate words
2. Verify database migration was run
3. Check browser console for errors

### Problem: Streak Shows 0
**Solution**:
1. Make sure you have activities on consecutive days
2. Check that dates are correct
3. Refresh the page

### Problem: Total Hours Seems Wrong
**Solution**:
1. Check all activities have duration_minutes set
2. Verify total_time field exists (see DATABASE_MIGRATION.md)
3. Refresh the page

---

## 📱 Mobile Usage

The tracker works great on mobile:
- Responsive design
- Touch-friendly buttons
- Easy form input
- Swipe to scroll activities

Perfect for logging right after your study session! 📲

---

## 🎉 Celebrate Your Progress!

### Milestone Rewards

**First Activity**: You started! 🎊  
**7-Day Streak**: One week! 🔥  
**30 Sessions**: Dedicated learner! 📚  
**100 Words**: Vocabulary builder! 📖  
**50 Hours**: Half-century! ⏱️

---

## 📚 Resources

### Learn More
- `README.md` - Full documentation
- `DATABASE_MIGRATION_NEW_FIELDS.md` - Database setup
- `CHANGELOG_COMPREHENSIVE_UPDATE.md` - All changes

### Need Help?
1. Check the troubleshooting section
2. Review the README
3. Open an issue on GitHub

---

## 🌟 Best Practices

1. **Log Immediately**: Right after studying, while fresh
2. **Be Specific**: Include actual words and sentences
3. **Be Honest**: Mood indicators help you improve
4. **Review Often**: Look at past activities for patterns
5. **Stay Consistent**: Daily practice beats long occasional sessions

---

**Ready to start? Head to the French Learning page and log your first activity! 🇫🇷**

*Bon courage! You've got this! 💪*
