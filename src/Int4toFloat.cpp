/******************************************************************************

                              Online C++ Compiler.
               Code, Compile, Run and Debug C++ program online.
Write your code in this editor and press "Run" button to compile and execute it.

*******************************************************************************/

#include <iostream>
#include <stdio.h>
#include <iomanip>
#include <string.h>
#include <string>
#include <math.h>
using namespace std;

void
printBits (float v)
{
  unsigned long *a;
  a = (unsigned long *) &v;
  int k = 0;
  for (unsigned long i = (unsigned)1 << 31; i >= 1; i >>= 1)
    {
      if (k == 1 || k == 9)
    // if(k%8==0&&k!=0)
	putchar (' ');
      k++;
      if (a[0] & i)
	putchar ('1');
      else
	putchar ('0');
    }
  cout << endl;
}

void
printBits (unsigned char v, bool endLine=true)
{
  unsigned long *a;
  a = (unsigned long *) &v;
//   int k = 0;
  for (unsigned long i = (unsigned)1 << 7; i >= 1; i >>= 1)
    {
    //   if (k == 1 || k == 9)
    // if(k%8==0&&k!=0)
// 	putchar (' ');
    //   k++;
      if (a[0] & i)
	putchar ('1');
      else
	putchar ('0');
    }
  if (endLine) cout << endl;
}

void
printBits (unsigned short v)
{
  unsigned long *a;
  a = (unsigned long *) &v;
  int k = 0;
  for (unsigned long i = (unsigned)1 << 15; i >= 1; i >>= 1)
    {
    if(k%8==0&&k!=0)
	putchar (' ');
	k++;
      if (a[0] & i)
	putchar ('1');
      else
	putchar ('0');
    }

//   cout << endl;
//   for (unsigned char i = 0; i < 4; i++)
//     {
//       cout << (int) b[i] << " ";
//     }
  cout << endl;
}
void
printBits (unsigned int v, int digits=31, bool spaces=false)
{
  unsigned int *a;
  a = (unsigned int *) &v;
  int k = 0;
  for (unsigned int i = (unsigned)1 << digits-1; i >= 1; i >>= 1)
    {
     if(k%8==0&&k!=0&&spaces)
 	putchar (' ');
	k++;
      if (a[0] & i)
	putchar ('1');
      else
	putchar ('0');
    }

//   cout << endl;
//   for (unsigned char i = 0; i < 4; i++)
//     {
//       cout << (int) b[i] << " ";
//     }
  cout << endl;
}


int
main ()
{
//   float v = 0.5;
//   for (; v<8;v*=2){
//     cout<<v<<endl;
//     printBits(v);
//     // cout<<-v<<endl;
//     // printBits(-v);
//   }
  float v = 0.5268022149909326;
  cout.precision (10);
  cout<<v<<endl;
  cout<<"  ";
  printBits (v);
  unsigned short *exP = (unsigned short *) &v;
  unsigned short exponent = exP[1];
  
  unsigned int *manP = (unsigned int *) &v;
  unsigned int mantisa = manP[0];
//   printBits(mantisa);
  mantisa = mantisa << 9;
//   printBits(mantisa);
  mantisa = mantisa >> 9;
//   printBits(mantisa);
//   cout<<sizeof(short)<<" "<<sizeof(int)<<" "<<sizeof(long)<<endl;
//   cout << sizeof (p1) << endl;;
//   cout << p1 << endl;
//   printBits (p1);
  unsigned short sign = exponent>>15; 
  if(sign)
    cout<<" "<<"-1*";
  else
    cout<<" "<<"+1*";
    
  exponent = exponent << 1;
//   printBits (p1);
  exponent = exponent >> 8;
  printBits ((unsigned char)exponent, false);
  cout<<"*";
  printBits(mantisa, 23);
  if(sign)
    cout<<" "<<"-1*";
  else
    cout<<" "<<"+1*";
  string exponentStr = to_string(exponent - 127); 
//   sprintf(exponentStr,"%d", exponent - 127);
  string print = "2^("+ exponentStr+")";
//   cout<<print;
//   cout <<"\n2^("<< exponent - 127 << ")";
  print +=std::string(12-print.length()-3-1, ' ')+"*"+to_string(double(mantisa)*pow(2,-23)+1);
  cout<<print;
  cout<<endl;
  int exp = floor(log(abs(v))/log(2));
  float mant = v/pow(2,exp);
  bool negativeM = (mant<0)?true:false;
  mant = abs(mant);
  printBits ((unsigned char)exponent, false);
  cout<<" ";
  printBits(mantisa, 24, true);
  int bits[4]; 
  bits[0] = exp+127;
  bits[1] = (negativeM)?short(floor((mant-1)*pow(2,7)))+128:short(floor((mant-1)*pow(2,7)));
  mant = (mant-1)*pow(2,7) - floor((mant-1)*pow(2,7));
  bits[2]= short(floor((mant)*pow(2,8)));
  mant = (mant)*pow(2,8) - floor((mant)*pow(2,8));
  bits[3] = short(floor((mant)*pow(2,8)));
  cout<<bits[0]<<" "<<bits[1]<<" "<<bits[2]<<" "<<bits[3]<<endl;
  float conV;
  conV = float(bits[2])*pow(2, -15)+float(bits[3])*pow(2, -23);
  cout<<conV<<endl;
  conV = (bits[1]>128)?-(conV+float(bits[1]-128)*pow(2, -7)+1):conV+float(bits[1])*pow(2, -7)+1;
  conV *= pow(2,bits[0]-127);
  cout<<conV;
//   long int value = 0;
//   printBits(value);
//   float *p = (float*) &value;
//   cout<<"p = "<<*p<<endl;
//   printBits((float) 0.00);
//   cout << sizeof (v) << " bytes" << endl;
//   cout.precision (10);
//   cout << v << ", " << v * 255 << ", " << v * 65025 << ", " << v * 16581375;
//   cout << endl;
//   printBits ((v * 1 - (long) v * 1) - (v * 255 - (long) v * 255) * 1. / 255.);
//   printBits ((v * 255 - (long) v * 255) -
//           (v * 65025 - (long) v * 65025) * 1. / 255.);
//   printBits ((v * 65025 - (long) v * 65025) -
//           (v * 16581375 - (long) v * 16581375) * 1. / 255.);
//   printBits ((v * 16581375 - (long) v * 16581375) -
//           (v * 16581375 - (long) v * 16581375) * 0.);

//   cout << printBits(v) << ", " << printBits(v * 255) << ", " << printBits(v * 65025) << ", " << printBits(v * 16581375);
  return 0;
}
