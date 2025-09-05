import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserWithPassword } from '@kinect/shared';

export interface IUserDocument extends Omit<IUserWithPassword, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    onboarding: {
      welcomeDemoCompleted: {
        type: Boolean,
        default: false,
      },
      welcomeDemoCompletedAt: {
        type: Date,
      },
      setupWizardCompleted: {
        type: Boolean,
        default: false,
      },
      setupWizardCompletedAt: {
        type: Date,
      },
      tourPreferences: {
        showTipsAndTricks: {
          type: Boolean,
          default: true,
        },
        autoStartTours: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  // Initialize onboarding field if it doesn't exist
  if (!this.onboarding) {
    this.onboarding = {
      welcomeDemoCompleted: false,
      setupWizardCompleted: false,
      tourPreferences: {
        showTipsAndTricks: true,
        autoStartTours: true,
      },
    };
  }

  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
