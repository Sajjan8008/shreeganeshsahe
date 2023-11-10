import { Router } from 'express';
import rolesRoutes from './roles.js';
import usersRoutes from './users.js';
import messagesRoutes from './messages.js';
import gamesRoutes from './game.js';
import gameHistoryRoutes from './gamesHistory.js';
import bettingTypesRoutes from './bettingTypes.js';
import bettingsRoutes from './bettings.js';
import tokensRoutes from './tokens.js';
import settingsRoutes from './settings.js'
import numberBettingHistoriesRoutes from './numberBettingHistories.js';
import transactionsRoutes from './transactions.js'
import dashboardRoutes from './dashboard.js';
import setsRoutes from './sets.js';
import boots from './boots.js';
import payment from './payment.js'
import errLogger from './logger.js';
import amountOption from './amountOptions.js';
import cashback from './cashback.js'
import dealertip from './dealertip.js'
import feedback from './feedback.js';
import boats from './boats.js';
import lockeddevices from './lockeddevices.js'
import ticketTicket from './tambolaTickets.js';
import tambolaGameHistory from './tambolaGameHistory.js'
import tambolaReward from './tambolaReward.js';
//bettingType

const router = Router();
router.use('/ticketcreate', ticketTicket);
router.use('/tambolaGameHistory', tambolaGameHistory);
router.use('/tambolaReward',tambolaReward);
router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/messages', messagesRoutes);
router.use('/games', gamesRoutes);
router.use('/gamehistory', gameHistoryRoutes);
router.use('/tokens', tokensRoutes);
router.use('/bettingtypes', bettingTypesRoutes);
router.use('/bettings', bettingsRoutes);
router.use('/settings', settingsRoutes);
router.use('/numberbettinghistories',numberBettingHistoriesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sets', setsRoutes);
router.use('/boots',boots);
router.use('/boats',boats);
router.use('/payment',payment);
router.use('/errorlog', errLogger);
router.use('/amountoption',amountOption);
router.use('/cashback',cashback);
router.use('/dealertip', dealertip );
router.use('/feedback',feedback);
router.use('/lockeddevices',lockeddevices);




export default router;