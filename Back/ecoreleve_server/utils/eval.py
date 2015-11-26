import operator
import re


class Eval():
    def get_operator_fn(self,op):
        return {
            '<' : operator.lt,
            '>' : operator.gt,
            '=' : operator.eq,
            '<>': operator.ne,
            '<=': operator.le,
            '>=': operator.ge,
            'Is' : operator.eq,
            'Is not' : operator.ne,
            'Like': operator.eq,
            'Not Like': operator.ne,
            }[op]
    def eval_binary_expr(self,op1, operator, op2):
        op1,op2 = op1, op2
        if(operator == 'Contains') :
           return op1.like('%'+op2+'%')
        if operator.lower() == 'in':
            l = [s for s in re.split("[,|;\W]+", op2)]
            return op1.in_(l)
        if operator.lower() == 'checked':
            operator = '='
            if '-1' in op2:
                return None
            return op1.in_(op2)

        return self.get_operator_fn(operator)(op1, op2)
